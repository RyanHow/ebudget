import { Injectable } from "@angular/core";

@Injectable()
export class DemoUI {
    interrupted: boolean;
    hotspotTop: number;
    hotspotLeft: number;

    pointerElement: HTMLDivElement;
    focusEnabled: boolean;
    
    constructor() {
        this.createPointer();
    }

    private createPointer() {

        if (document.getElementById('demo-pointer')) document.getElementById('demo-pointer').remove();

        this.pointerElement = document.createElement('div');
        this.pointerElement.id = 'demo-pointer';
        this.pointerElement.style.position = 'fixed';
        this.pointerElement.style.width = '10px';
        this.pointerElement.style.height = '10px';
        this.pointerElement.style.borderRadius = '5px';
        this.pointerElement.style.backgroundColor = 'black';
        this.pointerElement.style.boxShadow = '1px 1px 5px rgba(0,0,0,0.5)';
        this.pointerElement.style.zIndex = '99999999';
        this.hotspotLeft = 5;
        this.hotspotTop = 5;
        this.pointerElement.style.top = (window.innerHeight / 2 - this.hotspotLeft) + 'px';
        this.pointerElement.style.left = (window.innerWidth / 2 - this.hotspotTop) + 'px';

        document.body.appendChild(this.pointerElement);

    }

    dispose() {
        if (document.getElementById('demo-pointer')) document.getElementById('demo-pointer').remove();
        if (document.activeElement && (<any>document.activeElement).blur)  (<any>document.activeElement).blur();
    }

    private movePointer(pos: {x: number, y: number}) {
        // TODO: Work out the distance and alter the duration (from a set of presets, eg. 100, 200, 300, 400, can round it...) before applying the change here...

        this.pointerElement.style.left = (pos.x - this.hotspotLeft) + 'px';
        this.pointerElement.style.top = (pos.y - this.hotspotTop) + 'px';
    }

    private showPointerClick() {

    }

    async showPointer() {
        this.pointerElement.style.display = '';
    }

    async hidePointer() {
        this.pointerElement.style.display = 'none';
    }

    interrupt() {
        this.interrupted = true;
    }

    resetInterrupt() {
        this.interrupted = false;
    }

    private getElementCenterPosition(elementSelector: string): {x: number, y: number} {

        let ele = <HTMLElement> document.querySelector(elementSelector);
        let el = ele;
        // from https://www.kirupa.com/html5/get_element_position_using_javascript.htm

        var xPos = 0;
        var yPos = 0;
        
        while (el) {
            if (el.tagName === "BODY") {
                // deal with browser quirks with body/window/document and page scroll
                var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
                var yScroll = el.scrollTop || document.documentElement.scrollTop;
            
                xPos += (el.offsetLeft - xScroll + el.clientLeft);
                yPos += (el.offsetTop - yScroll + el.clientTop);
            } else {
                // for all other non-BODY elements
                xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
                yPos += (el.offsetTop - el.scrollTop + el.clientTop);
            }
        
            el = <HTMLElement> el.offsetParent;
        }

        return {x: xPos + ele.offsetWidth / 2, y: yPos + ele.offsetHeight / 2};


    }

    moveTo(elementSelector: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.movePointer(this.getElementCenterPosition(elementSelector));
            setTimeout(() => resolve(), 1000);
        });
    }

    click(elementSelector: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let ele = <HTMLElement> document.querySelector(elementSelector);
            //ele.click();

            let evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('mousedown',true,true,document.defaultView,0,0,0,this.pointerElement.offsetLeft,this.pointerElement.offsetTop,false,false,false,false,1,null);
            ele.dispatchEvent(evt);

            if (this.focusEnabled) {
                if (ele.querySelector('input')) ele.querySelector('input').focus();
                else ele.focus(); 
            }

            setTimeout(() => {
                let evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('mouseup',true,true,document.defaultView,0,0,0,this.pointerElement.offsetLeft,this.pointerElement.offsetTop,false,false,false,false,1,null);
                ele.dispatchEvent(evt);
                evt = document.createEvent('MouseEvents');
                evt.initMouseEvent('click',true,true,document.defaultView,0,0,0,this.pointerElement.offsetLeft,this.pointerElement.offsetTop,false,false,false,false,1,null);
                ele.dispatchEvent(evt);
                resolve();
            }, 30);
        });

        // TODO: Some way to test / wait for action ?
    }

    input(elementSelector: string, text: string): Promise<void> {
        let ele = <HTMLInputElement> document.querySelector(elementSelector);
        if (ele.querySelector('input')) ele = ele.querySelector('input');
        ele.value = '';
        if (text.length === 0) return Promise.resolve();

        return new Promise<void>((resolve, reject) => {
            this.typeChars(ele, text, resolve);
            // TODO: Check value at the end is correct ?
        });

    }

    private typeChars(ele: HTMLInputElement, chars: string, resolve: () => void) {
        if (this.interrupted) return;
        ele.value = ele.value + chars.substr(0, 1);
        ele.dispatchEvent(new Event('input', {'bubbles': true, 'cancelable': true}));
        if (chars.length > 1) setTimeout(() => this.typeChars(ele, chars.substr(1), resolve), 200);
        else resolve();
    }

}