import { I18n } from '../../services/I18n';

export class PaperNotification extends HTMLElement {

    // #region CONFIGURATION & ÉTAT
    // ============================================================================
    private static currentInstance: PaperNotification | null = null;
    
    private message: string = "";
    private type: 'confirm' | 'alert' = 'alert';
    private onConfirm: (() => void) | null = null;
    // #endregion

    // #region API PUBLIQUE STATIQUE
    // ============================================================================
    static show(message: string, type: 'confirm' | 'alert' = 'alert', onConfirm?: () => void) {
        this.clearCurrentInstance();

        const notif = document.createElement('paper-notification') as PaperNotification;
        notif.configure(message, type, onConfirm);

        document.body.appendChild(notif);
        this.currentInstance = notif;

        requestAnimationFrame(() => notif.classList.add('visible'));
    }

    private static clearCurrentInstance() {
        if (this.currentInstance) {
            this.currentInstance.remove();
            this.currentInstance = null;
        }
    }
    // #endregion

    // #region CYCLE DE VIE
    // ============================================================================
    connectedCallback() {
        this.renderLayout();
        this.bindEvents();
    }

    private configure(message: string, type: 'confirm' | 'alert', onConfirm?: () => void) {
        this.message = message;
        this.type = type;
        this.onConfirm = onConfirm || null;
    }
    // #endregion

    // #region RENDU
    // ============================================================================
    private renderLayout() {
        this.innerHTML = /*html*/ `
            <div class="paper-letter">
                <div class="seal"></div>
                <p style="margin-top:10px; font-weight:bold; color:#5d4037;">${this.message}</p>
                
                <div class="letter-actions">
                    ${this.buildButtonsHTML()}
                </div>
            </div>
        `;
    }

    private buildButtonsHTML(): string {
        if (this.type === 'confirm') {
            return /*html*/ `
                <button id="btn-yes">${I18n.t('btn_confirm')}</button>
                <button id="btn-no">${I18n.t('btn_cancel')}</button>
            `;
        }
        return /*html*/ `<button id="btn-ok">${I18n.t('btn_understood')}</button>`;
    }
    // #endregion

    // #region INTERACTIONS
    // ============================================================================
    private bindEvents() {
        this.querySelector('#btn-yes')?.addEventListener('click', () => this.handleConfirm());
        this.querySelector('#btn-no')?.addEventListener('click', () => this.close());
        this.querySelector('#btn-ok')?.addEventListener('click', () => this.close());
    }

    private handleConfirm() {
        if (this.onConfirm) this.onConfirm();
        this.close();
    }

    private close() {
        this.classList.remove('visible');
        
        setTimeout(() => {
            this.remove();
            if (PaperNotification.currentInstance === this) {
                PaperNotification.currentInstance = null;
            }
        }, 300);
    }
    // #endregion
}

customElements.define('paper-notification', PaperNotification);