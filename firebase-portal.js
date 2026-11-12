import { getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { createUserWithEmailAndPassword, deleteUser, getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { doc, getFirestore, serverTimestamp, writeBatch } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const firebaseConfig = {
    apiKey: 'AIzaSyDjzmlKtVLNes-gQT4OpU7cvKcu8Cce_Sk',
    authDomain: 'lc-academy-890df.firebaseapp.com',
    projectId: 'lc-academy-890df',
    storageBucket: 'lc-academy-890df.firebasestorage.app',
    messagingSenderId: '186139500601',
    appId: '1:186139500601:web:79004b1edcc767ac6bade8'
};

const app = getApps().find((candidate) => candidate.options.projectId === firebaseConfig.projectId)
    || initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

function getRegistrationError(error) {
    const messages = {
        'auth/email-already-in-use': 'Este correo ya tiene una cuenta. Utiliza otro correo o solicita ayuda al administrador.',
        'auth/invalid-email': 'El correo ingresado no tiene un formato válido.',
        'auth/weak-password': 'Firebase rechazó la contraseña generada. Vuelve a generarla e inténtalo otra vez.',
        'auth/operation-not-allowed': 'El método Correo/Contraseña no está habilitado en Firebase Authentication.',
        'auth/network-request-failed': 'No se pudo conectar con Firebase. Revisa tu conexión a internet.',
        'auth/too-many-requests': 'Firebase limitó temporalmente los intentos. Espera unos minutos e inténtalo de nuevo.',
        'permission-denied': 'Firestore rechazó el registro. Verifica las reglas de seguridad y el acceso del usuario.',
        'unavailable': 'Firestore no está disponible temporalmente. Inténtalo nuevamente.'
    };
    return messages[error?.code] || 'No se pudo completar el registro con Firebase. Inténtalo nuevamente o contacta al administrador.';
}

export async function createRegisteredUser({ collectionName, email, password, rol, sections, printableData, directoryData }) {
    if (collectionName !== 'teachers' && collectionName !== 'students') {
        throw new TypeError('La colección de registro no es válida.');
    }

    let user;
    let printDataSaved = false;

    try {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        user = credential.user;
        const userDocument = doc(db, collectionName, user.uid);
        const directoryDocument = doc(db, 'usuarios', user.uid);
        const credentialSectionName = collectionName === 'teachers' ? 'credenciales' : 'academico_credenciales';

        sessionStorage.setItem('datosFichaImpresion', JSON.stringify({
            ...printableData,
            authUid: user.uid
        }));
        printDataSaved = true;

        const batch = writeBatch(db);
        const directoryRecord = {
            authUid: user.uid,
            rol,
            nombre: directoryData.nombre,
            ci: directoryData.ci || '',
            rude: directoryData.rude || '',
            curso: directoryData.curso || '',
            createdAt: serverTimestamp()
        };
        if (collectionName === 'teachers') directoryRecord.rda = directoryData.rda || '';

        batch.set(userDocument, {
            authUid: user.uid,
            rol,
            ...sections,
            [credentialSectionName]: {
                ...sections[credentialSectionName],
                authUid: user.uid
            },
            createdAt: serverTimestamp()
        });
        batch.set(directoryDocument, directoryRecord);
        await batch.commit();
        return user.uid;
    } catch (error) {
        console.error('Falló la creación de la cuenta o el guardado del registro en Firebase.', error);
        const cleanupErrors = [];

        if (printDataSaved) {
            try {
                sessionStorage.removeItem('datosFichaImpresion');
            } catch (cleanupError) {
                cleanupErrors.push(cleanupError);
            }
        }

        if (user) {
            try {
                await deleteUser(user);
            } catch (cleanupError) {
                cleanupErrors.push(cleanupError);
            }
        }

        if (cleanupErrors.length) {
            console.error('No se pudo revertir por completo el registro parcialmente creado.', cleanupErrors);
            throw new Error(`${getRegistrationError(error)} La cuenta pudo haberse creado, pero no se completó el guardado; contacta al administrador antes de volver a intentarlo.`);
        }

        throw new Error(getRegistrationError(error));
    }
}
