
document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chatWindow');
    const chatToggle = document.getElementById('chatToggle');
    const closeChat = document.getElementById('closeChat');
    const minimizeChat = document.getElementById('minimizeChat');
    const openChatMain = document.getElementById('openChatMain');

    const chatMessages = document.getElementById('chatMessages');
    const chatOptions = document.getElementById('chatOptions');

    let token = null;
    let started = false;
    let busy = false;
    let locations = null;

    const propertyTypes = [
        { label: 'Lotes', value: '1' },
        { label: 'Casas', value: '2' },
        { label: 'Departamentos', value: '3' }
    ];

    function openWindow() {
        chatWindow.classList.add('active');
        chatWindow.setAttribute('aria-hidden', 'false');
        chatToggle.style.display = 'none';

        if (!started) startConversation();
    }

    function closeWindow() {
        chatWindow.classList.remove('active');
        chatWindow.setAttribute('aria-hidden', 'true');
        chatToggle.style.display = 'flex';
    }

    function addMessage(text, role = 'bot') {
        if (!text) return;

        const element = document.createElement('div');
        element.className = `message ${role}`;
        element.textContent = text;

        chatMessages.appendChild(element);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function clearOptions() {
        chatOptions.innerHTML = '';
    }

    function setBusy(value) {
        busy = value;
        chatOptions.querySelectorAll('button').forEach(button => {
            button.disabled = value;
        });
    }

    function showOptions(options, callback) {
        clearOptions();

        options.forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'option-button';
            button.textContent = option.label;

            button.addEventListener('click', async () => {
                if (busy) return;

                addMessage(option.label, 'user');
                clearOptions();

                await callback(option.value, option);
            });

            chatOptions.appendChild(button);
        });
    }

    function showError(error) {
        console.error(error);
        clearOptions();

        addMessage(
            'Lo sentimos, no pudimos procesar tu solicitud. Por favor, intenta nuevamente.'
        );

        showOptions(
            [{ label: 'Volver al menú principal', value: 'menu' }],
            () => showMainMenu()
        );
    }

    function getToken(response) {
        return response?.data?.token
            ?? response?.token
            ?? response?.data?.conversation?.session_token
            ?? response?.conversation?.session_token
            ?? null;
    }

    async function startConversation() {
        if (started || busy) return;

        setBusy(true);

        try {
            const response = await ChatAPI.start();

            token = getToken(response);

            if (!token) {
                throw new Error('Laravel no devolvió el token de conversación.');
            }

            started = true;

            addMessage(
                response.message
                ?? response.data?.message
                ?? '¡Hola! Bienvenido a GV Inmobiliaria. ¿En qué podemos ayudarte?'
            );

            showMainMenu();

        } catch (error) {
            showError(error);
        } finally {
            setBusy(false);
        }
    }

    function showMainMenu() {
        addMessage('Selecciona una opción para continuar:');

        showOptions([
            { label: '🏡 Buscar proyectos', value: '1' },
            { label: '❓ Consultar información', value: '2' },
            { label: '👨‍💼 Hablar con un asesor', value: '3' }
        ], async value => {
            await sendMessage(value);
        });
    }

    async function loadDistricts() {
        if (!locations) {
            const response = await ChatAPI.getLocations();
            locations = response.data ?? response;
        }

        const districts = Object.values(locations.distrito ?? {});

        if (!districts.length) {
            addMessage('Por el momento no tenemos distritos disponibles.');
            return;
        }

        addMessage('¿En qué distrito estás buscando un proyecto?');

        showOptions(
            districts.map(district => ({
                label: district.name,
                value: district.slug
            })),
            async slug => {
                await sendMessage(slug);
            }
        );
    }

    function showPropertyTypes() {
        addMessage('¿Qué tipo de inmueble te interesa?');

        showOptions(propertyTypes, async value => {
            await sendMessage(value);
        });
    }

    function showProjects(projects) {
        clearOptions();

        if (!Array.isArray(projects) || projects.length === 0) {
            addMessage('No encontramos proyectos con esos criterios.');

            showOptions([
                { label: 'Buscar en otro distrito', value: 'district' },
                { label: 'Volver al menú principal', value: 'menu' }
            ], async value => {
                if (value === 'district') {
                    await loadDistricts();
                } else {
                    showMainMenu();
                }
            });

            return;
        }

        addMessage('Estos son los proyectos que encontramos:');

        projects.forEach(project => {
            const card = document.createElement('article');
            card.className = 'project-card';

            if (project.image) {
                const image = document.createElement('img');
                image.src = project.image;
                image.alt = project.name ?? 'Proyecto inmobiliario';
                image.loading = 'lazy';
                card.appendChild(image);
            }

            const content = document.createElement('div');
            content.className = 'project-card-content';

            const title = document.createElement('h4');
            title.textContent = project.name ?? 'Proyecto inmobiliario';
            content.appendChild(title);

            if (project.district) {
                const district = document.createElement('p');
                district.textContent = `📍 ${project.district}`;
                content.appendChild(district);
            }

            if (project.price_from) {
                const price = document.createElement('p');
                price.textContent = `Desde: S/ ${Number(project.price_from).toLocaleString('es-PE')}`;
                content.appendChild(price);
            }

            if (project.area_from) {
                const area = document.createElement('p');
                area.textContent = `Área desde: ${project.area_from} m²`;
                content.appendChild(area);
            }

            if (project.excerpt) {
                const description = document.createElement('p');
                description.textContent = project.excerpt;
                content.appendChild(description);
            }

            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = 'Seleccionar proyecto';

            button.addEventListener('click', async () => {
                if (busy) return;

                addMessage(`Seleccionar: ${project.name}`, 'user');
                clearOptions();

                await selectProject(project.id);
            });

            content.appendChild(button);
            card.appendChild(content);
            chatMessages.appendChild(card);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function selectProject(projectId) {
        setBusy(true);

        try {
            const response = await ChatAPI.selectProject(token, projectId);

            addMessage(
                response.message
                ?? response.data?.message
                ?? '¡Excelente elección!'
            );

            showCaptureForm('name');

        } catch (error) {
            showError(error);
        } finally {
            setBusy(false);
        }
    }

    function showCaptureForm(type) {
        clearOptions();

        // Captura del nombre: se mantiene independiente.
        if (type === 'name') {
            const form = document.createElement('form');
            form.className = 'capture-form';

            const label = document.createElement('label');
            label.textContent = '¿Cuál es tu nombre?';

            const input = document.createElement('input');
            input.type = 'text';
            input.name = 'name';
            input.placeholder = 'Ej. Juan Pérez';
            input.required = true;
            input.minLength = 2;
            input.maxLength = 255;

            const button = document.createElement('button');
            button.type = 'submit';
            button.textContent = 'Continuar';

            form.append(label, input, button);

            form.addEventListener('submit', async event => {
                event.preventDefault();

                const name = input.value.trim();

                if (!name || busy) return;

                addMessage(name, 'user');
                clearOptions();

                await sendMessage(name);
            });

            chatOptions.appendChild(form);
            input.focus();
            return;
        }

        // Captura simultánea de teléfono y correo.
        if (type === 'phone') {
            const form = document.createElement('form');
            form.className = 'capture-form';

            const phoneLabel = document.createElement('label');
            phoneLabel.textContent = 'Número de celular';

            const phoneInput = document.createElement('input');
            phoneInput.type = 'tel';
            phoneInput.name = 'phone';
            phoneInput.placeholder = 'Ej. 987654321';
            phoneInput.inputMode = 'numeric';
            phoneInput.pattern = '[0-9+ ]{9,15}';
            phoneInput.required = true;

            const emailLabel = document.createElement('label');
            emailLabel.textContent = 'Correo electrónico';

            const emailInput = document.createElement('input');
            emailInput.type = 'email';
            emailInput.name = 'email';
            emailInput.placeholder = 'Ej. correo@gmail.com';
            emailInput.required = true;
            emailInput.maxLength = 255;

            const button = document.createElement('button');
            button.type = 'submit';
            button.textContent = 'Enviar mis datos';

            form.append(
                phoneLabel,
                phoneInput,
                emailLabel,
                emailInput,
                button
            );

            form.addEventListener('submit', async event => {
                event.preventDefault();

                if (busy || !form.reportValidity()) return;

                const phone = phoneInput.value.trim();
                const email = emailInput.value.trim().toLowerCase();

                addMessage(
                    `Celular: ${phone}\nCorreo: ${email}`,
                    'user'
                );

                clearOptions();

                await submitContactDetails(phone, email);
            });

            chatOptions.appendChild(form);
            phoneInput.focus();
        }
    }

    async function submitContactDetails(phone, email) {
        if (!token || busy) return;

        setBusy(true);

        try {
            const response = await ChatAPI.captureContactDetails(
                token,
                phone,
                email
            );

            if (response.message) {
                addMessage(response.message);
            }

            await handleResponse(response);

        } catch (error) {
            showError(error);
        } finally {
            setBusy(false);
        }
    }

    async function sendMessage(content) {
        if (!token || busy) return;

        setBusy(true);

        try {
            const response = await ChatAPI.sendMessage(token, content);

            const message = response.message
                ?? response.data?.message;

            if (message) addMessage(message);

            await handleResponse(response);

        } catch (error) {
            showError(error);
        } finally {
            setBusy(false);
        }
    }

    async function handleResponse(response) {
        const state = response.flow_state
            ?? response.data?.flow_state;

        const data = response.data ?? {};

        switch (state) {
            case 'main_menu':
                showMainMenu();
                break;

            case 'select_district':
                await loadDistricts();
                break;

            case 'select_property_type':
                showPropertyTypes();
                break;

            case 'select_project':
                showProjects(
                    response.projects
                    ?? data.projects
                    ?? data.data
                    ?? []
                );
                break;

            case 'capture_name':
                showCaptureForm('name');
                break;

            case 'capture_phone':
                showCaptureForm('phone');
                break;

            case 'completed':
                addMessage(
                    '¡Gracias por confiar en GV Inmobiliaria! Hemos registrado tus datos. Un asesor comercial podrá continuar con tu atención.'
                );

                showOptions([
                    { label: 'Volver al menú principal', value: 'menu' }
                ], () => showMainMenu());
                break;

            default:
                if (response.projects || data.projects) {
                    showProjects(response.projects ?? data.projects);
                } else {
                    showMainMenu();
                }
        }
    }

    // Eventos del widget de WordPress
    if (chatToggle) {
        chatToggle.addEventListener('click', openWindow);
    }

    if (closeChat) {
        closeChat.addEventListener('click', closeWindow);
    }

    if (minimizeChat) {
        minimizeChat.addEventListener('click', closeWindow);
    }
});
