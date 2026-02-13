import { Window } from "happy-dom";

const window = new Window();

global.window = window as any;
global.document = window.document as any;
global.HTMLElement = window.HTMLElement as any;
global.customElements = window.customElements as any;
global.localStorage = window.localStorage as any;