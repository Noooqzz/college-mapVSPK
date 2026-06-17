// ========== КОНФИГУРАЦИЯ (ЗАМЕНИТЕ НА СВОИ ФАЙЛЫ) ==========
    // Изображения этажей (поместите в ту же папку)
    const floorImages = {
        1: "1 этаж.jfif",     
        2: "photo_5251627787985035619_y.jpg",  
        3: "5dcb5be7-ea63-4e04-b1a0-21044dea0b33.jfif"   
    };

    // Списки помещений по этажам (для отображения в боковой панели)
    const floorRooms = {
        1: ["Главный вход", "Главный коридор", "Столовая", "Главная лестница 1 этажа"],
        2: ["Главный коридор", "Коридор", "Главная лестница 2 этажа"],
        3: ["Кабинет 3.13", "Кабинет 3.9", "Кабинет 3.10", "Кабинет 3.17", "Главная лестница 3 этажа"]
    };

    // Описания помещений
    const roomsData = {
        "Главный вход": { desc: "Основной вход в колледж", hours: "08:30–17:00" },
        "Столовая": { desc: "Обеденный зал", hours: "9:00-16:00" },
        "Туалет (М)": { desc: "Мужской туалет" },
        "Туалет (Ж)": { desc: "Женский туалет" },
        "Главная лестница": { desc: "Центральная лестница между этажами" },
        "Библиотека": { desc: "Читальный зал", hours: "08:30–17:00" },
        "Коридор": { desc: "Основной коридор 2 этажа" },
        "Кабинет 2.5": { desc: "Учебный кабинет" },
        "Кабинет 2.6": { desc: "Учебный кабинет" },
        "Кабинет 3.13": { desc: "Кабинет информатики", capacity: "15 ПК" },
        "Кабинет 3.11": { desc: "Кабинет информатики" },
        "Кабинет 3.16": { desc: "Кабинет информатики" }
    };
    const scenes = window.PANORAMA_SCENES || [];
    const roomPanoramaMapByFloor = {
        1: { "Главный вход": "Вход.jpg", "Главный коридор": "Главный коридор 1 этажа.jpg", "Столовая": "Столовая.jpg", "Главная лестница 1 этажа": "Лестница 1 этаж.jpg"  },
        2: { "Главная лестница 2 этажа": "Лестница 2 этаж.jpg", "Главный коридор": "2 этаж холл.jpg", "Коридор": "2 этаж коридор.jpg" },
        3: { "Кабинет 3.13": "3.13.JPG", "Кабинет 3.10": "3.10.jpg", "Кабинет 3.9": "3.9.jpg", "3 этаж коридор": "3 этаж коридор.jpg","3 этаж холл": "3 этаж холл.jpg", "Кабинет 3.17": "3.17.jpg", "Главная лестница 3 этажа": "Лестница 3 этаж.jpg" }
    };
    const defaultPanoramaPerFloor = { 1: "scene_01", 2: "scene_04", 3: "scene_06" };
    let currentFloor = 1;
    let scale = 1;
    let translateX = 0, translateY = 0;
    let isDraggingImg = false;
    let startX, startY, startTranslateX, startTranslateY;
    const img = document.getElementById('floor-image');
    const mapWrapper = document.getElementById('map-wrapper');
    let panoramaViewer = null;
    let currentSceneId = scenes[0]?.id || null;

    // Папки ресурсов: из-за кириллицы и пробелов URL собираем безопасно
    function assetUrl(kind, file) {
        return encodeURIComponent(file).replace(/%2F/g, '/');
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function showNotification(msg) {
        const notif = document.getElementById('notification');
        document.getElementById('notification-text').innerText = msg;
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 2500);
    }

    function centerImage() {
        if (!img.complete || img.naturalWidth === 0) return;
        const wrapperRect = mapWrapper.getBoundingClientRect();
        const imgRect = img.getBoundingClientRect();
        const scaleX = wrapperRect.width / imgRect.width;
        const scaleY = wrapperRect.height / imgRect.height;
        const newScale = Math.min(scaleX, scaleY) * 0.9;
        scale = newScale;
        translateX = 0;
        translateY = 0;
        updateTransform();
        document.getElementById('zoom-level').innerText = Math.round(scale * 100) + '%';
    }
    function updateTransform() {
        img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    function zoomIn() {
        scale = Math.min(3, scale + 0.1);
        updateTransform();
        document.getElementById('zoom-level').innerText = Math.round(scale * 100) + '%';
    }
    function zoomOut() {
        scale = Math.max(0.3, scale - 0.1);
        updateTransform();
        document.getElementById('zoom-level').innerText = Math.round(scale * 100) + '%';
    }
    function resetView() {
        centerImage();
    }
    function move(dx, dy) {
        translateX += dx;
        translateY += dy;
        updateTransform();
    }
    function onMouseDown(e) {
        isDraggingImg = true;
        startX = e.clientX;
        startY = e.clientY;
        startTranslateX = translateX;
        startTranslateY = translateY;
        img.style.cursor = 'grabbing';
        e.preventDefault();
    }
    function onMouseMove(e) {
        if (!isDraggingImg) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        translateX = startTranslateX + dx;
        translateY = startTranslateY + dy;
        updateTransform();
    }
    function onMouseUp() {
        isDraggingImg = false;
        img.style.cursor = 'grab';
    }

    // Загрузка этажа
    function loadFloor(floor) {
        currentFloor = floor;
        const src = floorImages[floor];
        if (src) img.src = assetUrl('maps', src);
        translateX = 0;
        translateY = 0;
        updateTransform();
        document.getElementById('current-floor-number').innerText = floor;
        document.getElementById('current-floor-label').innerHTML = floor + ' этаж';
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.floor) === floor) btn.classList.add('active');
        });
        updateRoomsList();
        document.getElementById('room-info').innerHTML = 'Выберите помещение из списка';
        document.getElementById('current-location-name').innerText = 'Не выбрано';
        document.getElementById('current-location-floor').innerText = '';
    }

    function updateRoomsList() {
        const container = document.getElementById('floor-rooms-list');
        const rooms = floorRooms[currentFloor] || [];
        if (!rooms.length) {
            container.innerHTML = '<div style="color:#94a3b8;">Нет данных</div>';
            return;
        }
        container.innerHTML = '';
        rooms.forEach(room => {
            const div = document.createElement('div');
            div.className = 'room-item';
            div.innerHTML = `<i class="fas fa-door-open" style="margin-right:0.6rem;"></i> ${room}`;
            div.addEventListener('click', () => {
                openPanoramaForRoom(room, currentFloor);
                showRoomInfo(room);
            });
            container.appendChild(div);
        });
    }

    function showRoomInfo(roomName) {
        const data = roomsData[roomName] || { desc: "Нет описания" };
        let html = `<strong>${roomName}</strong><br><span>${data.desc}</span>`;
        if (data.hours) html += `<br><i class="fas fa-clock"></i> ${data.hours}`;
        if (data.capacity) html += `<br><i class="fas fa-users"></i> ${data.capacity}`;
        document.getElementById('room-info').innerHTML = html;
        document.getElementById('current-location-name').innerText = roomName;
        document.getElementById('current-location-floor').innerText = currentFloor + ' этаж';
    }

    // Панорамы
    function buildPanoramaConfig() {
        const configScenes = {};
        scenes.forEach(scene => {
            configScenes[scene.id] = {
                type: "equirectangular",
                panorama: assetUrl('panoramas', scene.panorama),
                title: scene.title,
                hotSpots: []
            };
        });
        return {
            default: { firstScene: scenes[0]?.id, autoLoad: true, showZoomCtrl: true, showFullscreenCtrl: true, compass: true },
            scenes: configScenes
        };
    }
    function updatePanoramaUI() {
        const titleSpan = document.getElementById('current-pano-title');
        if (titleSpan) titleSpan.innerText = scenes.find(s => s.id === currentSceneId)?.title || 'Панорама';
        document.querySelectorAll('.pano-scene-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sceneId === currentSceneId);
        });
    }
    function navigatePanorama(delta) {
        if (!panoramaViewer) return;
        let idx = scenes.findIndex(s => s.id === currentSceneId) + delta;
        if (idx < 0) idx = scenes.length - 1;
        if (idx >= scenes.length) idx = 0;
        const newScene = scenes[idx];
        if (newScene && newScene.id !== currentSceneId) {
            panoramaViewer.loadScene(newScene.id);
            currentSceneId = newScene.id;
            updatePanoramaUI();
        }
    }
    function openPanoramaForRoom(roomName, floor) {
        let target = roomPanoramaMapByFloor[floor]?.[roomName];
        if (!target) {
            target = defaultPanoramaPerFloor[floor];
            if (target) showNotification(`Для "${roomName}" нет своей панорамы, открываю общую для ${floor} этажа`);
            else { showNotification(`Панорама для "${roomName}" не задана`); return; }
        }
        let foundScene = scenes.find(s => s.id === target || s.panorama === target);
        if (!foundScene) { showNotification(`Панорама не найдена`); return; }
        const modal = document.getElementById('panorama-modal');
        modal.style.display = 'flex';
        if (!panoramaViewer) {
            panoramaViewer = pannellum.viewer('panorama-viewer', buildPanoramaConfig());
            panoramaViewer.on('scenechange', (newId) => {
                currentSceneId = newId;
                updatePanoramaUI();
            });
            panoramaViewer.loadScene(foundScene.id);
            currentSceneId = foundScene.id;
        } else {
            panoramaViewer.loadScene(foundScene.id);
            currentSceneId = foundScene.id;
        }
        const container = document.getElementById('pano-scenes-list');
        if (container.children.length === 0) {
            scenes.forEach(scene => {
                const btn = document.createElement('button');
                btn.innerText = scene.title;
                btn.classList.add('pano-scene-btn');
                if (scene.id === currentSceneId) btn.classList.add('active');
                btn.dataset.sceneId = scene.id;
                btn.addEventListener('click', () => {
                    if (panoramaViewer && scene.id !== currentSceneId) {
                        panoramaViewer.loadScene(scene.id);
                        currentSceneId = scene.id;
                        updatePanoramaUI();
                    }
                });
                container.appendChild(btn);
            });
        }
        updatePanoramaUI();
    }
    function openDefaultPanorama() {
        const defaultId = defaultPanoramaPerFloor[currentFloor];
        if (!defaultId) { showNotification('Для этого этажа нет панорамы по умолчанию'); return; }
        let foundScene = scenes.find(s => s.id === defaultId || s.panorama === defaultId);
        if (!foundScene) { showNotification('Панорама по умолчанию не найдена'); return; }
        const modal = document.getElementById('panorama-modal');
        modal.style.display = 'flex';
        if (!panoramaViewer) {
            panoramaViewer = pannellum.viewer('panorama-viewer', buildPanoramaConfig());
            panoramaViewer.on('scenechange', (newId) => {
                currentSceneId = newId;
                updatePanoramaUI();
            });
            panoramaViewer.loadScene(foundScene.id);
            currentSceneId = foundScene.id;
        } else {
            panoramaViewer.loadScene(foundScene.id);
            currentSceneId = foundScene.id;
        }
        const container = document.getElementById('pano-scenes-list');
        if (container.children.length === 0) {
            scenes.forEach(scene => {
                const btn = document.createElement('button');
                btn.innerText = scene.title;
                btn.classList.add('pano-scene-btn');
                if (scene.id === currentSceneId) btn.classList.add('active');
                btn.dataset.sceneId = scene.id;
                btn.addEventListener('click', () => {
                    if (panoramaViewer && scene.id !== currentSceneId) {
                        panoramaViewer.loadScene(scene.id);
                        currentSceneId = scene.id;
                        updatePanoramaUI();
                    }
                });
                container.appendChild(btn);
            });
        }
        updatePanoramaUI();
    }
    function closePanoramaModal() {
        document.getElementById('panorama-modal').style.display = 'none';
    }

    // Поиск
    function searchRoom() {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        if (!query) { showNotification('Введите название'); return; }
        let foundRoom = null, foundFloor = null;
        for (let floor in floorRooms) {
            const room = floorRooms[floor].find(r => r.toLowerCase().includes(query));
            if (room) { foundRoom = room; foundFloor = parseInt(floor); break; }
        }
        if (foundRoom) {
            if (foundFloor !== currentFloor) loadFloor(foundFloor);
            setTimeout(() => {
                openPanoramaForRoom(foundRoom, foundFloor);
                showRoomInfo(foundRoom);
            }, 100);
            document.getElementById('search-input').value = '';
        } else { showNotification('Ничего не найдено'); }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    window.addEventListener('DOMContentLoaded', () => {
        let progress = 0;
        const pb = document.getElementById('loading-progress');
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                document.getElementById('loading').style.opacity = '0';
                setTimeout(() => document.getElementById('loading').style.display = 'none', 400);
            }
            pb.style.width = progress + '%';
        }, 150);
        loadFloor(1);
        img.onload = () => centerImage();
        if (img.complete) img.onload();

        // События кнопок
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const floor = parseInt(btn.dataset.floor);
                if (!isNaN(floor) && floor !== currentFloor) loadFloor(floor);
            });
        });
        document.getElementById('zoom-in').addEventListener('click', zoomIn);
        document.getElementById('zoom-out').addEventListener('click', zoomOut);
        document.getElementById('reset-view').addEventListener('click', resetView);
        document.getElementById('nav-up').addEventListener('click', () => move(0, -30));
        document.getElementById('nav-down').addEventListener('click', () => move(0, 30));
        document.getElementById('nav-left').addEventListener('click', () => move(-30, 0));
        document.getElementById('nav-right').addEventListener('click', () => move(30, 0));
        img.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        img.style.cursor = 'grab';
        document.getElementById('search-btn').addEventListener('click', searchRoom);
        document.getElementById('search-input').addEventListener('keypress', e => { if (e.key === 'Enter') searchRoom(); });
        document.getElementById('open-panorama-btn').addEventListener('click', openDefaultPanorama);
        document.getElementById('close-panorama-btn').addEventListener('click', closePanoramaModal);
        document.getElementById('prev-pano-btn').addEventListener('click', () => navigatePanorama(-1));
        document.getElementById('next-pano-btn').addEventListener('click', () => navigatePanorama(1));
        document.getElementById('panorama-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('panorama-modal')) closePanoramaModal();
        });
        document.addEventListener('keydown', (e) => {
            if (document.getElementById('panorama-modal').style.display === 'flex') {
                if (e.key === 'ArrowLeft') navigatePanorama(-1);
                else if (e.key === 'ArrowRight') navigatePanorama(1);
                else if (e.key === 'Escape') closePanoramaModal();
            }
        });
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'flex';
        });
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            });
        });
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });
    });
