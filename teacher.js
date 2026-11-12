import { createRegisteredUser } from './firebase-portal.js';
import { initializePortal, showPortalAlert, translateNATO } from './shared-portal.js';

const teacherForm = document.getElementById('user-form');

function fieldValue(id) {
    return teacherForm.elements.namedItem(id)?.value?.trim() || '';
}

function collectValues(ids) {
    return Object.fromEntries(ids.map((id) => [id, fieldValue(id)]));
}

async function registerTeacher() {
    const password = fieldValue('userGeneratedPass');
    const email = fieldValue('userEmailTeacher');
    const selectedArea = teacherForm.elements.namedItem('area-Cap')?.selectedOptions[0]?.textContent.trim() || '';
    const selectedSubject = ['materiaAreaPrimary', 'materiaAreaSecundary', 'materiaKinder']
        .map((id) => teacherForm.elements.namedItem(id))
        .find((select) => select && !select.classList.contains('hidden') && select.value);
    const identity = {
        rda: fieldValue('rdaCode'),
        ci: fieldValue('teacherCI'),
        ciComplemento: fieldValue('teacherCIComp'),
        ciExpedido: fieldValue('teacherCIExp'),
        nombres: fieldValue('teacherNames'),
        primerApellido: fieldValue('teacherFirstLast'),
        segundoApellido: fieldValue('teacherSecondLast'),
        fechaNacimiento: fieldValue('teacherBirth'),
        sexo: fieldValue('teacherSex'),
        certificadoNacimiento: collectValues(['certOficialia', 'certLibro', 'certPartida', 'certFolio']),
        lugarNacimiento: collectValues(['birthDept', 'birthProv', 'birthMuni', 'birthLoc'])
    };
    const location = collectValues([
        'addrDept', 'addrProv', 'addrMuni', 'addrLoc',
        'addrZona', 'addrCalle', 'addrNum', 'addrPhone'
    ]);
    const communications = collectValues([
        'teacherWhatsapp', 'teacherLandline', 'teacherContactEmail',
        'teacherInstagram', 'teacherTiktok', 'emergNombre',
        'emergWhatsapp', 'emergPhone', 'emergDireccion'
    ]);
    const academic = {
        materiasDominio: fieldValue('materiaDom'),
        areaEspecialidad: selectedArea,
        materiaEspecialidad: selectedSubject?.selectedOptions[0]?.textContent.trim() || '',
        institucionEgreso: fieldValue('egresoInstitution'),
        fechaEgreso: fieldValue('dateEgress'),
        aniosExperiencia: fieldValue('experienceYear'),
        hablaIdiomaOriginario: fieldValue('lenguajeOrig'),
        idiomaOriginario: fieldValue('nationOrig'),
        idiomaExtranjero: fieldValue('lenguajeExtr')
    };
    const credentials = {
        correo: email,
        passwordStoredInAuth: true,
        natoStoredInFirestore: false
    };
    const printableData = {
        rol: 'Docente',
        codigo: identity.rda,
        nombreCompleto: [
            identity.nombres,
            identity.primerApellido,
            identity.segundoApellido
        ].filter(Boolean).join(' '),
        ci: [identity.ci, identity.ciComplemento, identity.ciExpedido].filter(Boolean).join(' '),
        nacimiento: identity.fechaNacimiento,
        telefono: location.addrPhone,
        direccion: Object.values(location).filter(Boolean).join(', '),
        especialidad: [
            academic.areaEspecialidad,
            academic.materiaEspecialidad,
            academic.materiasDominio
        ].filter(Boolean).join(' — '),
        enlaceNombre: communications.emergNombre,
        enlaceRelacion: 'Contacto de emergencia',
        enlaceTel: communications.emergWhatsapp,
        enlaceDir: communications.emergDireccion,
        correo: email,
        password,
        nato: translateNATO(password),
        identidad: identity,
        ubicacion: location,
        comunicacion_redes: communications,
        formacion_academica: academic
    };

    try {
        await createRegisteredUser({
            collectionName: 'teachers',
            email,
            password,
            rol: 'Docente',
            sections: {
                identidad: identity,
                ubicacion: location,
                comunicacion_redes: communications,
                formacion_academica: academic,
                credenciales: credentials
            },
            directoryData: {
                nombre: printableData.nombreCompleto,
                ci: printableData.ci,
                rude: '',
                rda: identity.rda,
                curso: academic.materiaEspecialidad || academic.areaEspecialidad
            },
            printableData
        });
        return true;
    } catch (error) {
        showPortalAlert(error instanceof Error ? error.message : 'No se pudo completar el registro docente.');
        return false;
    }
}

function changeMaterias() {
    const area = document.getElementById('area-Cap');
    const options = [
        ['primary', 'materiaAreaPrimary'],
        ['secondary', 'materiaAreaSecundary'],
        ['kinder', 'materiaKinder']
    ];
    for (const [value, id] of options) {
        const select = document.getElementById(id);
        if (!select) continue;
        const isSelected = area?.value === value;
        select.classList.toggle('hidden', !isSelected);
        if (!isSelected) select.value = '';
    }
}

function optionLenguaje() {
    const language = document.getElementById('lenguajeOrig');
    const nation = document.getElementById('nationOrig');
    if (!language || !nation) return;
    const isVisible = language.value === 'yes';
    nation.classList.toggle('hidden', !isVisible);
    if (isVisible && nation.value === 'Ninguno') nation.value = '';
    if (!isVisible) nation.value = 'Ninguno';
}

function updateProvinces(departmentId, provinceId) {
    const department = document.getElementById(departmentId);
    const province = document.getElementById(provinceId);
    if (!department || !province) return;
    province.dataset.department = department.value;
}

initializePortal({ onRegister: registerTeacher });
document.getElementById('area-Cap')?.addEventListener('change', changeMaterias);
document.getElementById('lenguajeOrig')?.addEventListener('change', optionLenguaje);
window.updateProvinces = updateProvinces;
changeMaterias();
optionLenguaje();
