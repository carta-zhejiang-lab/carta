(globalThis.webpackChunkcarta_frontend=globalThis.webpackChunkcarta_frontend||[]).push([[833],{43833:function(e){e.exports=function(){"use strict";var e=function(){var t=0,n=document.createElement("div");function l(e){return n.appendChild(e.dom),e}function a(e){for(var l=0;l<n.children.length;l++)n.children[l].style.display=l===e?"block":"none";t=e}n.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",n.addEventListener("click",(function(e){e.preventDefault(),a(++t%n.children.length)}),!1);var i=(performance||Date).now(),o=i,r=0,f=l(new e.Panel("FPS","#0ff","#002")),c=l(new e.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var d=l(new e.Panel("MB","#f08","#201"));return a(0),{REVISION:16,dom:n,addPanel:l,showPanel:a,begin:function(){i=(performance||Date).now()},end:function(){r++;var e=(performance||Date).now();if(c.update(e-i,200),o+1e3<=e&&(f.update(1e3*r/(e-o),100),o=e,r=0,d)){var t=performance.memory;d.update(t.usedJSHeapSize/1048576,t.jsHeapSizeLimit/1048576)}return e},update:function(){i=this.end()},domElement:n,setMode:a}};return e.Panel=function(e,t,n){var l=1/0,a=0,i=Math.round,o=i(window.devicePixelRatio||1),r=80*o,f=48*o,c=3*o,d=2*o,p=3*o,u=15*o,s=74*o,h=30*o,m=document.createElement("canvas");m.width=r,m.height=f,m.style.cssText="width:80px;height:48px";var v=m.getContext("2d");return v.font="bold "+9*o+"px Helvetica,Arial,sans-serif",v.textBaseline="top",v.fillStyle=n,v.fillRect(0,0,r,f),v.fillStyle=t,v.fillText(e,c,d),v.fillRect(p,u,s,h),v.fillStyle=n,v.globalAlpha=.9,v.fillRect(p,u,s,h),{dom:m,update:function(f,w){l=Math.min(l,f),a=Math.max(a,f),v.fillStyle=n,v.globalAlpha=1,v.fillRect(0,0,r,u),v.fillStyle=t,v.fillText(i(f)+" "+e+" ("+i(l)+"-"+i(a)+")",c,d),v.drawImage(m,p+o,u,s-o,h,p,u,s-o,h),v.fillRect(p+s-o,u,o,h),v.fillStyle=n,v.globalAlpha=.9,v.fillRect(p+s-o,u,o,i((1-f/w)*h))}}},e}()}}]);