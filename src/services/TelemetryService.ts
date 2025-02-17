import axios, {AxiosInstance} from "axios";
import {CARTA} from "carta-protobuf";
import {DBSchema, IDBPDatabase, openDB} from "idb";
import {jwtDecode} from "jwt-decode";
import {computed, flow, makeObservable, observable} from "mobx";
import {v1 as uuidv1} from "uuid";

import {CARTA_INFO} from "models";
import {PreferenceKeys, PreferenceStore} from "stores";
import {getUnixTimestamp} from "utilities";

export enum TelemetryMode {
    None = "none",
    Minimal = "minimal",
    Usage = "usage"
}

export enum TelemetryAction {
    Connection = "connection",
    EndSession = "endSession",
    RetryConnection = "retryConnection",
    OptIn = "optIn",
    OptOut = "optOut",
    FileOpen = "fileOpen",
    FileClose = "fileClose",
    SpectralProfileGeneration = "spectralProfileGeneration",
    PvGeneration = "pvGeneration",
    MomentGeneration = "momentGeneration",
    CatalogLoading = "catalogLoading"
}

export interface TelemetryMessage {
    timestamp: number;
    id: string;
    sessionId: string;
    usageEntry?: boolean;
    action: TelemetryAction;
    version: string;
    details?: any;
}

interface TelemetryDb extends DBSchema {
    entries: {
        value: TelemetryMessage;
        key: number;
    };
}

export class TelemetryService {
    private static staticInstance: TelemetryService;

    public static readonly ServerUrl = "https://telemetry.cartavis.org";
    private static readonly SubmissionIntervalSeconds = 300;
    private static readonly EntryLimit = 1000;
    private static readonly DbName = "telemetry";
    private static readonly StoreName = "entries";

    static get Instance() {
        if (!TelemetryService.staticInstance) {
            TelemetryService.staticInstance = new TelemetryService();
        }
        return TelemetryService.staticInstance;
    }

    @computed get effectiveTelemetryMode() {
        const preferences = PreferenceStore.Instance;
        if (!this.skipTelemetry && preferences.telemetryConsentShown && preferences.telemetryUuid) {
            return preferences.telemetryMode;
        }
        return TelemetryMode.None;
    }

    @computed get consentRequired() {
        const preferences = PreferenceStore.Instance;
        return !this.skipTelemetry && !preferences.telemetryConsentShown;
    }

    @computed get decodedUserId() {
        return this.uuid;
    }

    private readonly sessionId: string;
    private readonly axiosInstance: AxiosInstance;
    private db: IDBPDatabase<TelemetryDb>;
    @observable private uuid: string;
    @observable private skipTelemetry: boolean;

    private constructor() {
        makeObservable(this);
        this.axiosInstance = axios.create({
            baseURL: TelemetryService.ServerUrl
        });
        this.sessionId = uuidv1();
        // Submit accumulated telemetry every 5 minutes, and when the user closes the frontend

        window.onbeforeunload = ev => {
            this.flushTelemetry(true);
            ev.preventDefault();
        };

        setInterval(this.flushTelemetry, TelemetryService.SubmissionIntervalSeconds * 1000);
    }

    @flow.bound *checkAndGenerateId(flush: boolean = false, forceNewId: boolean = false) {
        const url = new URL(window.location.href);
        const skipTelemetry = url.searchParams.get("skipTelemetry");
        // Check for URL query parameter or build-time flag for skipping telemetry
        if (skipTelemetry || process.env.REACT_APP_SKIP_TELEMETRY === "true") {
            console.log(`Skipping telemetry due to ${skipTelemetry ? "URL override" : "build-time override"}`);
            this.skipTelemetry = true;
            return false;
        }

        const preferences = PreferenceStore.Instance;
        let token = preferences.telemetryUuid;

        if (!token || forceNewId) {
            try {
                const res = yield this.axiosInstance.get("/api/token");
                token = res.data?.token;
                const decodedObject = jwtDecode(token) as any;
                if (decodedObject?.uuid) {
                    yield preferences.setPreference(PreferenceKeys.TELEMETRY_UUID, token);
                    console.log(`Generated new telemetry ID ${decodedObject.uuid}. This will only be used if telemetry consent is given.`);
                    if (forceNewId) {
                        yield this.clearTelemetry();
                    }
                }
            } catch (err) {
                console.warn("Could not generate telemetry UUID");
                return false;
            }
        }

        if (!token) {
            console.warn("Could not generate telemetry UUID");
            return false;
        }

        try {
            const decodedObject: {uuid?: string} = jwtDecode(token);
            if (decodedObject?.uuid) {
                this.uuid = decodedObject.uuid;
            }
        } catch (err) {
            console.warn("Malformed telemetry token");
            return false;
        }

        this.axiosInstance.defaults.headers.common = {Authorization: `Bearer ${token}`};

        if (flush) {
            this.flushTelemetry();
        }

        return true;
    }

    async optIn(mode: TelemetryMode) {
        const preferences = PreferenceStore.Instance;
        await preferences.setPreference(PreferenceKeys.TELEMETRY_CONSENT_SHOWN, true);
        await preferences.setPreference(PreferenceKeys.TELEMETRY_MODE, mode);

        const entry: TelemetryMessage = {
            timestamp: getUnixTimestamp(),
            id: uuidv1(),
            sessionId: this.sessionId,
            version: CARTA_INFO.version,
            action: TelemetryAction.OptIn
        };

        try {
            await this.axiosInstance.post("/api/submit", [entry]);
        } catch (err) {
            console.log("Telemetry server unavailable");
        }
    }

    async optOut() {
        const preferences = PreferenceStore.Instance;
        await preferences.setPreference(PreferenceKeys.TELEMETRY_CONSENT_SHOWN, true);
        await preferences.setPreference(PreferenceKeys.TELEMETRY_MODE, TelemetryMode.None);

        const entry: TelemetryMessage = {
            id: uuidv1(),
            timestamp: getUnixTimestamp(),
            sessionId: this.sessionId,
            version: CARTA_INFO.version,
            action: TelemetryAction.OptOut
        };

        try {
            await this.axiosInstance.post("/api/submit", [entry]);
        } catch (err) {
            console.log("Telemetry server unavailable");
        }
    }

    flushTelemetry = async (includeEndSession: boolean = false) => {
        if (this.effectiveTelemetryMode !== TelemetryMode.None) {
            if (this.effectiveTelemetryMode === TelemetryMode.Minimal) {
                // TODO: Filter DB entries to remove usage stats if any exist in current DB
            }

            if (!this.uuid) {
                await this.checkAndGenerateId();
            }

            const db = await this.getDb();
            const entries = (await db.getAll(TelemetryService.StoreName)) ?? [];

            if (includeEndSession) {
                const endSessionEntry: TelemetryMessage = {
                    id: uuidv1(),
                    timestamp: getUnixTimestamp(),
                    sessionId: this.sessionId,
                    version: CARTA_INFO.version,
                    action: TelemetryAction.EndSession,
                    usageEntry: false
                };

                entries.push(endSessionEntry);
                // Add telemetry entry without waiting for the promise to return, to prevent it interrupting the window unload handler
                this.addTelemetryEntry(TelemetryAction.EndSession, undefined, endSessionEntry.id);
            }

            if (!entries?.length) {
                return;
            }

            try {
                const res = await this.axiosInstance.post("/api/submit", entries);
                if (res.status === 200) {
                    await this.clearTelemetry();
                    console.debug(`Submitted ${entries.length} telemetry entries`);
                }
            } catch (err) {
                console.debug("Telemetry server not available");
            }
        }
    };

    async clearTelemetry() {
        const db = await this.getDb();
        await db.clear(TelemetryService.StoreName);
    }

    async getDb() {
        if (!this.db) {
            this.db = await openDB<TelemetryDb>(TelemetryService.DbName, 1, {
                upgrade(database: IDBPDatabase<TelemetryDb>) {
                    database.createObjectStore(TelemetryService.StoreName, {
                        keyPath: "timestamp"
                    });
                }
            });
        }
        return this.db;
    }

    addFileOpenEntry(id: number, type: CARTA.FileType, width: number, height: number, depth: number, stokes: number, generated: boolean) {
        const fileType = Object.keys(CARTA.FileType).find(key => CARTA.FileType[key] === type);
        return this.addTelemetryEntry(TelemetryAction.FileOpen, {id, fileType, width, height, depth, stokes, generated});
    }

    addFileCloseEntry(id: number) {
        return this.addTelemetryEntry(TelemetryAction.FileClose, {id});
    }

    addSpectralProfileEntry(profileLength: number, regionType: CARTA.RegionType, regionId: number, width: number, height: number, depth: number) {
        switch (regionType) {
            case CARTA.RegionType.POINT:
                TelemetryService.Instance.addTelemetryEntry(TelemetryAction.SpectralProfileGeneration, {profileLength, regionId: regionId, regionType, depth});
                break;
            case CARTA.RegionType.RECTANGLE:
            case CARTA.RegionType.POLYGON:
                TelemetryService.Instance.addTelemetryEntry(TelemetryAction.SpectralProfileGeneration, {profileLength, regionId: regionId, regionType, width, height, depth});
                break;
            case CARTA.RegionType.ELLIPSE:
                TelemetryService.Instance.addTelemetryEntry(TelemetryAction.SpectralProfileGeneration, {profileLength, regionId: regionId, regionType, semi_major: width, semi_minor: height, depth});
                break;
            default:
                break;
        }
    }

    async addTelemetryEntry(action: TelemetryAction, details?: object, id?: string) {
        // All other actions are considered usage stats
        const isUsageEntry = !(action === TelemetryAction.Connection || action === TelemetryAction.EndSession);
        const preferences = PreferenceStore.Instance;
        const loggingEnabled = preferences.telemetryLogging;
        const loggingPrefix = `[Telemetry] [uuid=${this.uuid}, sessionId=${this.sessionId}]`;
        const timestamp = getUnixTimestamp();

        const entryAllowed = this.effectiveTelemetryMode === TelemetryMode.Usage || (!isUsageEntry && this.effectiveTelemetryMode === TelemetryMode.Minimal);
        if (entryAllowed) {
            const telemetryMessage: TelemetryMessage = {
                id: id || uuidv1(),
                timestamp,
                sessionId: this.sessionId,
                version: CARTA_INFO.version,
                action,
                details,
                usageEntry: isUsageEntry
            };

            if (loggingEnabled) {
                console.debug(`${loggingPrefix} ${telemetryMessage.action} ${details ? JSON.stringify(details) : ""}`);
            }

            try {
                const db = await this.getDb();
                let numEntries = await db.count(TelemetryService.StoreName);
                if (numEntries >= TelemetryService.EntryLimit) {
                    // Create a single transaction that deletes oldest telemetry entries to make space
                    const tx = db.transaction(TelemetryService.StoreName, "readwrite");
                    const cursor = await tx.store.openCursor();
                    const store = tx.store;
                    if (cursor && store) {
                        while (numEntries >= TelemetryService.EntryLimit) {
                            tx.store.delete(cursor.key);
                            await cursor.continue();
                            numEntries--;
                        }
                        tx.store.add(telemetryMessage);
                        await tx.done;
                    }
                } else {
                    await db.add(TelemetryService.StoreName, telemetryMessage);
                }
            } catch (err) {
                console.warn(err);
            }
        } else if (loggingEnabled) {
            console.debug(`${loggingPrefix} NO-OP (disabled due to ${preferences.telemetryConsentShown ? "user preference" : "lack of explicit consent"})`);
        }
    }
}
