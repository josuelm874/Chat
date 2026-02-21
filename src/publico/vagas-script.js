let allJobs = [];
let filteredJobs = [];

async function loadJobs() {
    try {
        const publishedJobs = JSON.parse(localStorage.getItem('publishedJobs') || '[]');
        allJobs = publishedJobs
            .filter(job => job.isPublished === true && job.status === 'published')
            .map(job => ({
                id: job.id,
                title: job.jobTitle,
                company: job.contributorName || 'Empresa',
                vacancies: job.vacancyQuantity,
                salary: job.salary,
                schedule: job.workSchedule,
                location: formatLocation(job.locationPreference, job.companyAddress),
                locationType: mapLocationType(job.locationPreference),
                description: job.jobDescription || '',
                fullDescription: job.jobDescription || '',
                requirements: job.requiredSkills || '',
                benefits: job.benefits || '',
                createdAt: job.publishedAt || job.createdAt
            }));
        allJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        filteredJobs = allJobs;
        displayJobs();
    } catch (error) {
        console.error('Erro ao carregar vagas:', error);
    }
}

function formatLocation(locationPreference, companyAddress) {
    const locationMap = {
        'remoto': 'Remoto',
        'presencial': 'Presencial',
        'hibrido': 'Híbrido',
        'qualquer': 'Remoto ou Presencial',
        'proximo': companyAddress ? `Próximo a ${companyAddress}` : 'Proximidade obrigatória',
        'mesma_cidade': 'Mesma cidade',
        'mesmo_estado': 'Mesmo estado'
    };
    return locationMap[locationPreference] || locationPreference || 'Não especificado';
}

function mapLocationType(locationPreference) {
    const typeMap = {
        'remoto': 'remoto',
        'presencial': 'presencial',
        'hibrido': 'hibrido',
        'qualquer': 'qualquer',
        'proximo': 'presencial',
        'mesma_cidade': 'presencial',
        'mesmo_estado': 'presencial'
    };
    return typeMap[locationPreference] || 'qualquer';
}

function displayJobs() {
    const container = document.getElementById('jobsContainer');
    const noJobs = document.getElementById('noJobs');
    if (filteredJobs.length === 0) {
        container.classList.add('hidden');
        noJobs.classList.remove('hidden');
        return;
    }
    container.classList.remove('hidden');
    noJobs.classList.add('hidden');
    container.innerHTML = filteredJobs.map(job => `
        <div class="job-card" onclick="openJobModal('${job.id}')">
            <div class="job-card-content">
                <div class="job-header">
                    <div>
                        <div class="job-title">${job.title}</div>
                        <div class="job-company">${job.company}</div>
                    </div>
                    <div class="job-badge">${job.vacancies} vaga(s)</div>
                </div>
                <div class="job-info">
                    <div class="job-info-item"><i class='bx bx-dollar'></i><span>${job.salary}</span></div>
                    <div class="job-info-item"><i class='bx bx-time'></i><span>${job.schedule}</span></div>
                    <div class="job-info-item"><i class='bx bx-map'></i><span>${job.location}</span></div>
                </div>
                <div class="job-description">${job.description}</div>
                <div class="job-footer">
                    <div class="job-salary">${job.salary}</div>
                    <button class="apply-btn" onclick="event.stopPropagation(); applyToJob('${job.id}')">
                        <i class='bx bx-send'></i> Candidatar-se
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function searchJobs() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const locationFilter = document.getElementById('filterLocation').value;
    const scheduleFilter = document.getElementById('filterSchedule').value;
    filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm ||
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.description.toLowerCase().includes(searchTerm);
        const matchesLocation = !locationFilter || job.locationType === locationFilter;
        const matchesSchedule = !scheduleFilter || job.schedule === scheduleFilter;
        return matchesSearch && matchesLocation && matchesSchedule;
    });
    displayJobs();
}

function openJobModal(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    document.getElementById('modalJobTitle').textContent = job.title;
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="job-detail-section">
            <h3>Informações da Vaga</h3>
            <div class="job-detail-item"><strong>Empresa:</strong> ${job.company}</div>
            <div class="job-detail-item"><strong>Cargo:</strong> ${job.title}</div>
            <div class="job-detail-item"><strong>Vagas Disponíveis:</strong> ${job.vacancies}</div>
            <div class="job-detail-item"><strong>Salário:</strong> ${job.salary}</div>
            <div class="job-detail-item"><strong>Regime:</strong> ${job.schedule}</div>
            <div class="job-detail-item"><strong>Localização:</strong> ${job.location}</div>
        </div>
        <div class="job-detail-section">
            <h3>Descrição da Vaga</h3>
            <p>${job.fullDescription || job.description}</p>
        </div>
        ${job.requirements ? `
        <div class="job-detail-section">
            <h3>Requisitos</h3>
            <p>${job.requirements}</p>
        </div>` : ''}
        ${job.benefits ? `
        <div class="job-detail-section">
            <h3>Benefícios</h3>
            <p>${job.benefits}</p>
        </div>` : ''}
        <div class="application-form">
            <h3>Candidatar-se a esta vaga</h3>
            <form id="applicationForm_${job.id}" onsubmit="submitApplication(event, '${job.id}')">
                <div class="form-group">
                    <label>Nome Completo *</label>
                    <input type="text" name="fullName" required>
                </div>
                <div class="form-group">
                    <label>E-mail *</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Telefone *</label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>Currículo (PDF) *</label>
                    <input type="file" name="resume" accept=".pdf" required>
                </div>
                <div class="form-group">
                    <label>Mensagem de Apresentação</label>
                    <textarea name="coverMessage" placeholder="Conte-nos um pouco sobre você..."></textarea>
                </div>
                <button type="submit" class="submit-application-btn">Enviar Candidatura</button>
            </form>
        </div>
    `;
    document.getElementById('jobModal').classList.add('active');
}

function closeJobModal() {
    document.getElementById('jobModal').classList.remove('active');
}

function applyToJob(jobId) {
    openJobModal(jobId);
}

function submitApplication(event, jobId) {
    event.preventDefault();
    const form = event.target;
    const fullName = form.querySelector('input[name="fullName"]').value;
    const email = form.querySelector('input[name="email"]').value;
    const phone = form.querySelector('input[name="phone"]').value;
    const coverMessage = form.querySelector('textarea[name="coverMessage"]').value || null;
    const fileInput = form.querySelector('input[name="resume"]');
    const job = allJobs.find(j => j.id === jobId);
    const applicationData = {
        id: 'application_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        jobId: jobId,
        jobTitle: job ? job.title : 'Vaga não encontrada',
        jobCompany: job ? job.company : 'Empresa não encontrada',
        fullName: fullName,
        email: email,
        phone: phone,
        coverMessage: coverMessage,
        status: 'pending',
        createdAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null
    };
    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function (e) {
            applicationData.resumeBase64 = e.target.result;
            applicationData.resumeFileName = file.name;
            applicationData.resumeFileType = file.type;
            applicationData.resumeFileSize = file.size;
            saveApplication(applicationData);
        };
        reader.onerror = function () {
            alert('Erro ao ler o arquivo. Por favor, tente novamente.');
        };
        reader.readAsDataURL(file);
    } else {
        saveApplication(applicationData);
    }
}

function saveApplication(applicationData) {
    try {
        const existingApplications = JSON.parse(localStorage.getItem('jobApplications') || '[]');
        existingApplications.push(applicationData);
        localStorage.setItem('jobApplications', JSON.stringify(existingApplications));
        localStorage.setItem('jobApplicationsUpdatedAt', Date.now().toString());
        console.log('Candidatura salva com sucesso:', applicationData);
        alert('Candidatura enviada com sucesso! Entraremos em contato em breve.');
        closeJobModal();
        const form = document.getElementById('applicationForm');
        if (form) form.reset();
    } catch (error) {
        console.error('Erro ao salvar candidatura:', error);
        alert('Erro ao enviar candidatura. Por favor, tente novamente.');
    }
}

document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchJobs();
});
document.getElementById('filterLocation').addEventListener('change', searchJobs);
document.getElementById('filterSchedule').addEventListener('change', searchJobs);
document.getElementById('jobModal').addEventListener('click', (e) => {
    if (e.target.id === 'jobModal') closeJobModal();
});

loadJobs();
