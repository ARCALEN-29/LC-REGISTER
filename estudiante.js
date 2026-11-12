import { createRegisteredUser } from './firebase-portal.js';
import { initializePortal, showPortalAlert, translateNATO } from './shared-portal.js';

const studentForm = document.getElementById('user-form');

function fieldValue(id) {
    return studentForm.elements.namedItem(id)?.value?.trim() || '';
}

function collectValues(ids) {
    return Object.fromEntries(ids.map((id) => [id, fieldValue(id)]));
}

function collectServices() {
    return Object.fromEntries(['svcWater', 'svcSewage', 'svcElectric', 'svcGas', 'svcTrash']
        .map((id) => [id, Boolean(studentForm.elements.namedItem(id)?.checked)]));
}

function calculateFinalGrade() {
    const grades = ['gradeT1', 'gradeT2', 'gradeT3']
        .map((id) => Number.parseFloat(fieldValue(id)));
    const finalGrade = document.getElementById('finalGrade');
    if (!finalGrade) return;

    if (grades.some((grade) => !Number.isFinite(grade) || grade < 1 || grade > 100)) {
        finalGrade.value = '';
        return;
    }

    finalGrade.value = (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(2);
}

function setBlockVisibility(blockId, shouldShow) {
    document.getElementById(blockId)?.classList.toggle('hidden', !shouldShow);
}

function toggleForeignerFields() {
    const foreigner = document.getElementById('studentNationality')?.value === 'Extranjera';
    setBlockVisibility('bolivian-id-fields', !foreigner);
    setBlockVisibility('foreigner-id-fields', foreigner);
}

function toggleDisabilityDetail() {
    setBlockVisibility('disability-detail-block', document.getElementById('hasDisability')?.value === 'Sí');
}

function toggleWorkDetails() {
    setBlockVisibility('work-details-block', document.getElementById('didWork')?.value === 'Sí');
}

function toggleTransportOther() {
    setBlockVisibility('transport-other-block', document.getElementById('transportMethod')?.value === 'Otro');
}

function toggleAbandonReasons() {
    setBlockVisibility('abandon-reasons-block', document.getElementById('didAbandon')?.value === 'Sí');
}

function toggleTutorSecondary() {
    const relation = document.getElementById('tutorRelation')?.value || '';
    const hasTwoTutors = relation === 'Ambos (Padre y Madre)';
    setBlockVisibility('tutor-secondary-block', hasTwoTutors);

    const labels = {
        Padre: 'Padre',
        Madre: 'Madre',
        'Tutor/a Legal': 'Tutor/a Legal'
    };
    const firstTutor = labels[relation] || 'Tutor/a';
    const secondTutor = hasTwoTutors ? 'Madre' : 'Segundo Responsable';
    const labelValues = [
        ['lbl-tutor1-ci', `C.I. del ${hasTwoTutors ? 'Padre' : firstTutor}`],
        ['lbl-tutor1-name', `Nombres y Apellidos del ${hasTwoTutors ? 'Padre' : firstTutor}`],
        ['lbl-tutor1-phone', `Celular del ${hasTwoTutors ? 'Padre' : firstTutor}`],
        ['lbl-tutor2-title', `Información de ${secondTutor}`],
        ['lbl-tutor2-ci', `C.I. de ${secondTutor}`],
        ['lbl-tutor2-name', `Nombres y Apellidos de ${secondTutor}`],
        ['lbl-tutor2-phone', `Celular de ${secondTutor}`]
    ];
    for (const [id, text] of labelValues) {
        const label = document.getElementById(id);
        if (label) label.textContent = text;
    }
}

function updateProvinces(departmentId, provinceId) {
    const department = document.getElementById(departmentId);
    const province = document.getElementById(provinceId);
    if (!department || !province) return;
    province.dataset.department = department.value;
}

async function registerStudent() {
    const password = fieldValue('userGeneratedPass');
    const email = fieldValue('userEmailStudent');
    const foreigner = fieldValue('studentNationality') === 'Extranjera';
    const identity = {
        rude: fieldValue('rudeCode'),
        nacionalidad: fieldValue('studentNationality'),
        ci: foreigner ? '' : fieldValue('studentCI'),
        ciComplemento: foreigner ? '' : fieldValue('studentCIComp'),
        ciExpedido: foreigner ? '' : fieldValue('studentCIExp'),
        documentoExtranjero: foreigner ? collectValues(['foreignDocType', 'foreignDocNum']) : null,
        nombres: fieldValue('studentNames'),
        primerApellido: fieldValue('studentFirstLast'),
        segundoApellido: fieldValue('studentSecondLast'),
        fechaNacimiento: fieldValue('studentBirth'),
        sexo: fieldValue('studentSex'),
        certificadoNacimiento: collectValues(['certOficialia', 'certLibro', 'certPartida', 'certFolio']),
        lugarNacimiento: collectValues(['birthDept', 'birthProv', 'birthMuni', 'birthLoc'])
    };
    const location = collectValues([
        'addrDept', 'addrProv', 'addrMuni', 'addrLoc',
        'addrZona', 'addrCalle', 'addrNum', 'addrPhone'
    ]);
    const socioeconomic = {
        idiomas: collectValues(['langChildhood', 'langFrequent', 'nationOrigin']),
        salud: collectValues(['hasHealthCenter', 'healthCarePlace', 'healthCenterVisits', 'hasInsurance']),
        discapacidad: collectValues(['hasDisability', 'disabilityType', 'hasDisorder']),
        talentoExtraordinario: fieldValue('hasTalentReport'),
        serviciosBasicos: collectServices(),
        internet: collectValues(['hasInternet', 'techDevices']),
        trabajo: collectValues(['didWork', 'workMonths', 'workActivity', 'workShift', 'workPayment']),
        transporte: collectValues(['transportMethod', 'transportOther', 'transportTime']),
        abandonoEscolar: collectValues(['didAbandon', 'abandonReasons'])
    };
    const tutor = {
        vinculo: fieldValue('tutorRelation'),
        responsablePrincipal: {
            ci: fieldValue('tutor1CI'),
            ciExpedido: fieldValue('tutor1CIExp'),
            nombreCompleto: fieldValue('tutor1FullName'),
            telefono: fieldValue('tutor1Phone'),
            idioma: fieldValue('tutor1Lang'),
            ocupacion: fieldValue('tutor1Job'),
            gradoInstruccion: fieldValue('tutor1Edu')
        },
        segundoResponsable: fieldValue('tutorRelation') === 'Ambos (Padre y Madre)' ? {
            ci: fieldValue('tutor2CI'),
            ciExpedido: fieldValue('tutor2CIExp'),
            nombreCompleto: fieldValue('tutor2FullName'),
            telefono: fieldValue('tutor2Phone'),
            idioma: fieldValue('tutor2Lang'),
            ocupacion: fieldValue('tutor2Job'),
            gradoInstruccion: fieldValue('tutor2Edu')
        } : null
    };
    const credentials = {
        promediosTrimestrales: collectValues(['gradeT1', 'gradeT2', 'gradeT3']),
        promedioFinal: fieldValue('finalGrade'),
        correo: email,
        passwordStoredInAuth: true,
        natoStoredInFirestore: false
    };
    const printableData = {
        rol: 'Estudiante',
        codigo: identity.rude,
        nombreCompleto: [
            identity.nombres,
            identity.primerApellido,
            identity.segundoApellido
        ].filter(Boolean).join(' '),
        ci: foreigner
            ? `${identity.documentoExtranjero.foreignDocType}: ${identity.documentoExtranjero.foreignDocNum}`
            : [identity.ci, identity.ciComplemento, identity.ciExpedido].filter(Boolean).join(' '),
        nacimiento: identity.fechaNacimiento,
        telefono: tutor.responsablePrincipal.telefono,
        direccion: Object.values(location).filter(Boolean).join(', '),
        especialidad: `RUDE ${identity.rude} — Promedio final ${credentials.promedioFinal}`,
        enlaceNombre: tutor.responsablePrincipal.nombreCompleto,
        enlaceRelacion: tutor.vinculo,
        enlaceTel: tutor.responsablePrincipal.telefono,
        enlaceDir: Object.values(location).filter(Boolean).join(', '),
        correo: email,
        password,
        nato: translateNATO(password),
        identidad: identity,
        ubicacion: location,
        socioeconomico_salud: socioeconomic,
        tutor,
        academico_credenciales: credentials
    };

    try {
        await createRegisteredUser({
            collectionName: 'students',
            email,
            password,
            rol: 'Estudiante',
            sections: {
                identidad: identity,
                ubicacion: location,
                socioeconomico_salud: socioeconomic,
                tutor,
                academico_credenciales: credentials
            },
            directoryData: {
                nombre: printableData.nombreCompleto,
                ci: printableData.ci,
                rude: identity.rude,
                curso: ''
            },
            printableData
        });
        return true;
    } catch (error) {
        showPortalAlert(error instanceof Error ? error.message : 'No se pudo completar el registro del estudiante.');
        return false;
    }
}

toggleForeignerFields();
toggleDisabilityDetail();
toggleWorkDetails();
toggleTransportOther();
toggleAbandonReasons();
toggleTutorSecondary();
calculateFinalGrade();
initializePortal({ onRegister: registerStudent });

Object.assign(window, {
    calculateFinalGrade,
    toggleAbandonReasons,
    toggleDisabilityDetail,
    toggleForeignerFields,
    toggleTransportOther,
    toggleTutorSecondary,
    toggleWorkDetails,
    updateProvinces
});
