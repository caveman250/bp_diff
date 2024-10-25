import { Application } from "./application";
import { Vector2 } from "./math/vector2";

export interface KeyAction {
    keycode: string
    ctrl: boolean;
    callback: (ev: KeyboardEvent) => boolean
}

enum MouseButton {
    Left,
    Middle,
    Right
}

export class Controller {

    private _actions: KeyAction[] = [];

    private _mouseDownData: {
        buttonType: MouseButton,
        position: Vector2
    }
    private _mousePositionOfPreviousMove: Vector2;
    private _element: HTMLCanvasElement;
    private app: Application;

    constructor(element: HTMLCanvasElement, app: Application) {

        this.app = app;

        this._element = element;
        if (Application.isFirefox) {
            this._element.setAttribute("contenteditable", ""); // allow pasting to the canvas
            this._element.style.cursor = "default";
            this._element.style.color = "transparent"; // Hide caret
        }

        // A tabindex higher than -1 is needed so that html element reseaves focus events
        // which is required that the key events get fired.
        element.tabIndex = 0;

        element.onmousedown = (ev) => this.onMouseDown(ev);
        element.onmouseup = (ev) => this.onMouseUp(ev);
        element.onmousemove = (ev) => this.onMouseMove(ev);
        element.onmouseenter = (ev) => this.onMouseEnter(ev);
        element.onmouseleave = (ev) => this.onMouseLeave(ev);
        element.onkeydown = (ev) => this.onKeydown(ev);
        element.oncontextmenu = (ev) => this.onContextMenu(ev);

        this.registerAction({
            ctrl: true,
            keycode: 'KeyA',
            callback: this.selectAllNodes.bind(this),
        });
    }

    registerAction(action: KeyAction) {
        this._actions.push(action);
    }

    onKeydown(ev : KeyboardEvent) {
        for (const action of this._actions.filter(a => a.keycode === ev.code)) {
            if(action.ctrl !== ev.ctrlKey) continue;

            if (action.callback(ev)) {
                ev.preventDefault();
            }
        }
    }

    onMouseDown(ev: MouseEvent) {
        this._mouseDownData = {
            buttonType: ev.button,
            position: this.getMousePosition(ev)
        }
        this._mousePositionOfPreviousMove = this._mouseDownData.position;
    }

    onMouseUp(ev: MouseEvent) {
        this._mouseDownData = null;
        this.app.scene.refresh();
    }

    onMouseMove(ev: MouseEvent) {
        const currentMousePosition = this.getMousePosition(ev);
        const mouseAbsolutePos = this.getAbsoluteMousePosition(ev);

        if (this._mouseDownData) {
            if (this._mouseDownData.buttonType === MouseButton.Left) {
                const delta = currentMousePosition.subtract(this._mousePositionOfPreviousMove);
                this._mousePositionOfPreviousMove = currentMousePosition;

                this.app.scene.camera.moveRelative(delta);
                this.app.scene.refresh();
                return false;
            }
        }

        return false;
    }

    onMouseEnter(ev: MouseEvent) {
        if (ev.buttons == 0) {
            this._mouseDownData = null;
        }
    }

    onMouseLeave(ev: MouseEvent) {
        if(this._mouseDownData) {
            if(this._mouseDownData.buttonType === MouseButton.Left) {

                this.app.scene.nodes.forEach(c => c.selected = false);
                this.app.scene.refresh();
                return false;
            }
        }
     }

    onContextMenu(ev: MouseEvent) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
    }

    getAbsoluteMousePosition(ev: MouseEvent) {
        const cameraPos = this.app.scene.camera.position;
        const currentMousePosition = this.getMousePosition(ev);
        const mouseAbsolutePos = new Vector2(currentMousePosition.x - cameraPos.x, currentMousePosition.y - cameraPos.y);

        return mouseAbsolutePos;
    }

    selectAllNodes() {
        this.app.scene.nodes.forEach(c => c.selected = true);
        this.app.scene.refresh();
        return true;
    }

    getMousePosition(ev: MouseEvent): Vector2 {
        let rect = this._element.getBoundingClientRect();
        return new Vector2(ev.clientX - rect.left, ev.clientY - rect.top);
    }
}

