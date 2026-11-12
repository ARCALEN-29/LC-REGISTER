import { signOut } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { auth, db } from './firebase-portal.js';

const queryInput = document.getElementById('directory-query');
const resultsElement = document.getElementById('directory-results');
const identityCard = document.getElementById('identity-card');
const statusElement = document.getElementById('directory-status');
const logoutButton = document.getElementById('logout-btn');

let users = [];
let selectedUserId = null;
let loaded = false;
let loadError = false;

function readPath(data, path) {
    return path.split('.').reduce((value, key) => {
        return value && typeof value === 'object' ? value[key] : undefined;
    }, data);
}

function firstValue(data, paths) {
    for (const path of paths) {
        const value = readPath(data, path);
        if (typeof value === 'string' || typeof value === 'number') {
            const text = String(value).trim();
            if (text) return text;
        }
    }
    return '';
}

function getUserDetails(data) {
    const givenNames = firstValue(data, ['identidad.nombres', 'personal_info.names', 'nombres']);
    const firstSurname = firstValue(data, ['identidad.primerApellido', 'personal_info.firstLast', 'primerApellido']);
    const secondSurname = firstValue(data, ['identidad.segundoApellido', 'personal_info.secondLast', 'segundoApellido']);
    const fullName = firstValue(data, ['nombre', 'nombreCompleto', 'fullName', 'name'])
        || [givenNames, firstSurname, secondSurname].filter(Boolean).join(' ');

    return {
        nombre: fullName || 'Nombre no disponible',
        ci: firstValue(data, ['ci', 'CI', 'identidad.ci', 'personal_info.ci']),
        rude: firstValue(data, ['rude', 'RUDE', 'codigoRude', 'identidad.rude', 'personal_info.rude']),
        rda: firstValue(data, ['rda', 'RDA', 'identidad.rda']),
        rol: firstValue(data, ['rol', 'role', 'tipoUsuario', 'userRole']),
        curso: firstValue(data, [
            'curso',
            'course',
            'academic_info.course',
            'academic_info.level',
            'academico.curso',
            'academico.nivel'
        ])
    };
}

function normalize(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es');
}

function createEmptyState(message) {
    const empty = document.createElement('div');
    empty.className = 'directory-empty';
    empty.textContent = message;
    return empty;
}

function appendIdentityField(container, label, value) {
    const field = document.createElement('div');
    const fieldLabel = document.createElement('span');
    const fieldValue = document.createElement('span');
    field.className = 'identity-field';
    fieldLabel.className = 'identity-field__label';
    fieldValue.className = 'identity-field__value';
    fieldLabel.textContent = label;
    fieldValue.textContent = value || 'No registrado';
    field.append(fieldLabel, fieldValue);
    container.append(field);
}

function renderIdentityCard(user) {
    identityCard.replaceChildren();
    if (!user) {
        identityCard.append(createEmptyState('Selecciona un registro para ver su tarjeta de identidad.'));
        return;
    }

    const details = getUserDetails(user.data);
    const heading = document.createElement('div');
    const badge = document.createElement('span');
    const icon = document.createElement('i');
    const titleWrap = document.createElement('div');
    const title = document.createElement('h3');
    const verified = document.createElement('p');
    const fields = document.createElement('div');
    heading.className = 'identity-card__heading';
    badge.className = 'identity-card__badge';
    icon.className = 'fas fa-user-check';
    icon.setAttribute('aria-hidden', 'true');
    title.textContent = 'Identidad verificada';
    verified.textContent = 'Registro sincronizado con Firestore';
    fields.className = 'identity-card__fields';
    badge.append(icon);
    titleWrap.append(title, verified);
    heading.append(badge, titleWrap);
    identityCard.append(heading, fields);

    appendIdentityField(fields, 'Nombre completo', details.nombre);
    appendIdentityField(fields, 'Cédula de identidad', details.ci);
    appendIdentityField(fields, 'Código RUDE', details.rude);
    if (details.rda) appendIdentityField(fields, 'Registro docente (RDA)', details.rda);
    appendIdentityField(fields, 'Rol', details.rol);
    appendIdentityField(fields, 'Curso', details.curso);
}

function getFilteredUsers() {
    const query = normalize(queryInput.value.trim());
    if (!query) return users;

    return users.filter(({ data }) => {
        const details = getUserDetails(data);
        const searchable = [details.nombre, details.ci, details.rude, details.rda, details.rol]
            .map(normalize)
            .join(' ');
        return searchable.includes(query);
    });
}

function renderResults() {
    const filteredUsers = getFilteredUsers();
    resultsElement.replaceChildren();

    if (!loaded && !loadError) {
        resultsElement.append(createEmptyState('Cargando registros…'));
    } else if (loadError) {
        resultsElement.append(createEmptyState('No se pudo cargar el directorio. Verifica tu sesión y los permisos de Firestore.'));
    } else if (!filteredUsers.length) {
        resultsElement.append(createEmptyState(queryInput.value.trim()
            ? 'No se encontraron registros con esos datos.'
            : 'Aún no hay usuarios registrados.'));
    } else {
        for (const user of filteredUsers) {
            const details = getUserDetails(user.data);
            const button = document.createElement('button');
            const name = document.createElement('span');
            const meta = document.createElement('span');
            button.type = 'button';
            button.className = 'directory-result';
            button.setAttribute('aria-pressed', String(user.id === selectedUserId));
            name.className = 'directory-result__name';
            meta.className = 'directory-result__meta';
            name.textContent = details.nombre;
            meta.textContent = [
                details.rol,
                details.ci && `C.I. ${details.ci}`,
                details.rude && `RUDE ${details.rude}`,
                details.rda && `RDA ${details.rda}`
            ]
                .filter(Boolean)
                .join(' · ');
            button.append(name, meta);
            button.addEventListener('click', () => {
                selectedUserId = user.id;
                renderResults();
                renderIdentityCard(users.find((entry) => entry.id === selectedUserId));
            });
            resultsElement.append(button);
        }
    }

    if (loadError) {
        statusElement.textContent = 'Error de conexión o permisos denegados.';
        return;
    }

    if (!loaded) {
        statusElement.textContent = 'Conectando con el directorio…';
        return;
    }

    statusElement.textContent = `${filteredUsers.length} ${filteredUsers.length === 1 ? 'registro encontrado' : 'registros encontrados'}.`;
    const selectedUser = users.find((user) => user.id === selectedUserId);
    if (!selectedUser || !filteredUsers.some((user) => user.id === selectedUserId)) {
        selectedUserId = null;
        renderIdentityCard(null);
    } else {
        renderIdentityCard(selectedUser);
    }
}

queryInput.addEventListener('input', renderResults);

onSnapshot(collection(db, 'usuarios'), (snapshot) => {
    users = snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
    loaded = true;
    loadError = false;
    renderResults();
}, (error) => {
    console.error('No se pudo sincronizar el directorio de usuarios.', error);
    loadError = true;
    loaded = true;
    renderResults();
});

logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('No se pudo cerrar la sesión de Firebase.', error);
        logoutButton.disabled = false;
        statusElement.textContent = 'No se pudo cerrar sesión. Inténtalo nuevamente.';
    }
});
