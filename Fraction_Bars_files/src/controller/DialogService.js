/**
 * A service to manage native HTML <dialog> elements.
 */
class DialogService {
    /**
     * Opens a dialog element and returns a promise that resolves when the dialog is closed.
     * The promise resolves with the value of the button that closed the dialog (e.g., "ok" or "cancel").
     * @param {string} dialogId The ID of the dialog element to show.
     * @returns {Promise<string|null>} The value of the closing button, or null if the dialog is not found.
     */
    show(dialogId) {
        return new Promise((resolve) => {
            const dialog = document.getElementById(dialogId);
            if (!dialog || dialog.tagName !== 'DIALOG') {
                console.error(`Dialog with ID "${dialogId}" not found or is not a <dialog> element.`);
                resolve(null);
                return;
            }

            const closeListener = () => {
                dialog.removeEventListener('close', closeListener);
                resolve(dialog.returnValue);
            };

            dialog.addEventListener('close', closeListener);
            dialog.showModal();
        });
    }
}

export const dialogService = new DialogService();