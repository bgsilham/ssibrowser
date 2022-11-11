import React from 'react';
import lgArconnect from '../../assets/logos/lg_arconnect.png';
import useArConnect from '../../hooks/useArConnect';
import styles from './styles.module.scss';

export interface IArConnect {
    className?: string;
}

//@todo re-evaluate IArConnect
function ArConnect({ className }: IArConnect) {
    const { connect, /*disconnect, isAuthenticated,*/ isArConnectInstalled } =
        useArConnect();

    const handleConnect = () => {
        if (isArConnectInstalled) {
            connect(() => {
                alert('SSI private key is now connected.');
            });
        } else {
            // @TODO: Improve this alert/ could add modal instead
            if (
                window.confirm(
                    'You have to download the ArConnect browser extension. Click OK to get redirected.'
                )
            ) {
                window.open('https://arconnect.io/');
            }
        }
    };

    /*const handleDisconnect = () =>
        disconnect(() => {
            // @TODO: Dispatch message to let the user know they successfully disconnected
        });*/

    return (
        <button
            type="button"
            className={`${styles.button} ${className}`}
            onClick={handleConnect}
        >
            <img src={lgArconnect} className={styles.logo} />
            <p className={styles.buttonText}>ArConnect</p>
        </button>
    );
}

export default ArConnect;

//@todo decide the design for alert boxes, preferably without dependencies.
// Or let's discuss which dependency is the best one (material-ui?)
