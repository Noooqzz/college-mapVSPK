// ==================== 3D-менеджер для всей сцены ====================
class ThreeDManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.clock = null;
        this.init();
    }
    
    async init() {
        try {
            const THREE = await import('three');
            const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
            
            this.THREE = THREE;
            this.OrbitControls = OrbitControls;
            this.GLTFLoader = GLTFLoader;
            
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111122);
            this.scene.fog = new THREE.FogExp2(0x111122, 0.008);
            
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            this.camera.position.set(5, 5, 10);
            this.camera.lookAt(0, 0, 0);
            
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.renderer.shadowMap.enabled = true;
            this.container.appendChild(this.renderer.domElement);
            
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = false;
            this.controls.enableZoom = true;
            this.controls.zoomSpeed = 1.2;
            this.controls.enablePan = true;
            this.controls.panSpeed = 0.8;
            
            const ambientLight = new THREE.AmbientLight(0x404060);
            this.scene.add(ambientLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 1);
            dirLight.position.set(5, 10, 7);
            dirLight.castShadow = true;
            dirLight.receiveShadow = true;
            this.scene.add(dirLight);
            const backLight = new THREE.PointLight(0x4466cc, 0.5);
            backLight.position.set(-2, 3, -4);
            this.scene.add(backLight);
            const fillLight = new THREE.PointLight(0xffaa66, 0.4);
            fillLight.position.set(2, 1, 3);
            this.scene.add(fillLight);
            
            const gridHelper = new THREE.GridHelper(20, 20, 0x88aaff, 0x335588);
            gridHelper.position.y = -1;
            this.scene.add(gridHelper);
            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper);
            
            this.loadDefaultModel();
            
            this.clock = new THREE.Clock();
            this.animate();
        } catch (err) {
            console.error('Ошибка инициализации Three.js:', err);
            if (window.collegeMapApp) window.collegeMapApp.showNotification('Не удалось загрузить 3D-движок', 5000);
        }
    }
    
    loadDefaultModel() {
        const defaultModelUrl = 'https://threejs.org/examples/models/gltf/SheenChair.glb';
        this.loadModel(defaultModelUrl);
    }
    
    loadModel(url) {
        if (!this.GLTFLoader) return;
        const loader = new this.GLTFLoader();
        loader.load(url, (gltf) => {
            if (this.model) this.scene.remove(this.model);
            this.model = gltf.scene;
            this.model.scale.set(1, 1, 1);
            this.model.position.set(0, 0, 0);
            this.model.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            this.scene.add(this.model);
            const box = new this.THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new this.THREE.Vector3());
            const size = box.getSize(new this.THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const distance = maxDim * 1.5;
            this.camera.position.set(distance, distance * 0.8, distance);
            this.camera.lookAt(center);
            this.controls.target.copy(center);
            this.controls.update();
            if (window.collegeMapApp) window.collegeMapApp.showNotification('3D модель загружена');
        }, undefined, (error) => {
            console.error('Ошибка загрузки модели:', error);
            if (window.collegeMapApp) window.collegeMapApp.showNotification('Ошибка загрузки 3D модели');
        });
    }
    
    loadModelFromFile(file) {
        const url = URL.createObjectURL(file);
        this.loadModel(url);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
    
    resetCamera() {
        if (this.model) {
            const box = new this.THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new this.THREE.Vector3());
            const size = box.getSize(new this.THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const distance = maxDim * 1.5;
            this.camera.position.set(distance, distance * 0.8, distance);
            this.camera.lookAt(center);
            this.controls.target.copy(center);
        } else {
            this.camera.position.set(5, 5, 10);
            this.camera.lookAt(0, 0, 0);
            this.controls.target.set(0, 0, 0);
        }
        this.controls.update();
    }
    
    resize() {
        if (!this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    startAnimation() {
        if (!this.clock) return;
        this.animate();
    }
    
    animate() {
        if (!this.renderer) return;
        requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// ==================== 3D-просмотрщик для отдельной комнаты ====================
class Room3DViewer {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
        this.THREE = null;
        this._animationId = null;
        this.init();
    }

    async init() {
        try {
            const THREE = await import('three');
            const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
            const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
            
            this.THREE = THREE;
            this.OrbitControls = OrbitControls;
            this.GLTFLoader = GLTFLoader;
            
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.container.innerHTML = '';
            
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x111122);
            
            const ambientLight = new THREE.AmbientLight(0x404060);
            this.scene.add(ambientLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
            dirLight.position.set(2, 3, 2);
            this.scene.add(dirLight);
            const fillLight = new THREE.PointLight(0x8866ff, 0.8);
            fillLight.position.set(1, 2, 1);
            this.scene.add(fillLight);
            const backLight = new THREE.PointLight(0xffaa66, 0.6);
            backLight.position.set(-1, 1, -2);
            this.scene.add(backLight);
            
            const axesHelper = new THREE.AxesHelper(2);
            this.scene.add(axesHelper);
            const gridHelper = new THREE.GridHelper(10, 20, 0x88aaff, 0x335588);
            gridHelper.position.y = -0.5;
            this.scene.add(gridHelper);
            
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            this.camera.position.set(3, 2, 5);
            this.camera.lookAt(0, 0, 0);
            
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.container.appendChild(this.renderer.domElement);
            
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.enableZoom = true;
            this.controls.zoomSpeed = 1.2;
            
            this.animate();
        } catch (err) {
            console.error('Ошибка инициализации Room3DViewer:', err);
        }
    }
    
    loadModel(url) {
        if (!this.GLTFLoader) return;
        const loader = new this.GLTFLoader();
        loader.load(url, (gltf) => {
            if (this.model) this.scene.remove(this.model);
            this.model = gltf.scene;
            const box = new this.THREE.Box3().setFromObject(this.model);
            const center = box.getCenter(new this.THREE.Vector3());
            const size = box.getSize(new this.THREE.Vector3());
            this.model.position.sub(center);
            const maxDim = Math.max(size.x, size.y, size.z);
            let scale = 1;
            if (maxDim < 0.5) scale = 2 / maxDim;
            if (maxDim > 5) scale = 5 / maxDim;
            this.model.scale.set(scale, scale, scale);
            this.model.traverse(node => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            this.scene.add(this.model);
            const newBox = new this.THREE.Box3().setFromObject(this.model);
            const newCenter = newBox.getCenter(new this.THREE.Vector3());
            const newSize = newBox.getSize(new this.THREE.Vector3());
            const newMaxDim = Math.max(newSize.x, newSize.y, newSize.z);
            const distance = newMaxDim * 1.8;
            this.camera.position.set(distance, distance * 0.7, distance);
            this.camera.lookAt(newCenter);
            this.controls.target.copy(newCenter);
            this.controls.update();
        }, undefined, (error) => {
            console.error('Ошибка загрузки модели:', error);
            if (window.collegeMapApp) window.collegeMapApp.showNotification('Ошибка загрузки 3D-модели');
        });
    }
    
    destroy() {
        if (this._animationId) cancelAnimationFrame(this._animationId);
        if (this.renderer) {
            this.renderer.dispose();
            if (this.container.contains(this.renderer.domElement)) this.container.removeChild(this.renderer.domElement);
        }
        this.container.innerHTML = '';
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.model = null;
    }
    
    resize() {
        if (!this.renderer || !this.camera) return;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        this._animationId = requestAnimationFrame(() => this.animate());
        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) this.renderer.render(this.scene, this.camera);
    }
}

// ==================== Основное приложение ====================
class CollegeMapApp {
    constructor() {
        this.config = {
            currentFloor: 1,
            zoomLevel: 1,
            maxZoom: 3,
            minZoom: 0.5,
            viewMode: '3d',
            selectedRoom: null,
            isPanoramaActive: false,
            canvas: null,
            ctx: null,
            rooms: [],
            scale: 1.5,
            offsetX: 0,
            offsetY: 0,
            isDragging: false,
            dragStartX: 0,
            dragStartY: 0,
            dragStartOffsetX: 0,
            dragStartOffsetY: 0
        };
        
        this.collegeData = this.initializeCollegeData();
        this.threeDManager = null;
        this.init();
    }
    
    initializeCollegeData() {
        return {
            info: {
                name: "Волгоградский социально-педагогический колледж",
                address: "г. Волгоград, ул. Кирова, 17",
                phone: "+7 (8442) 94-08-40"
            },
            floorPlan: {
                1: {
                    name: "Первый этаж",
                    description: "Вход, охрана, спортзал, столовая, туалеты",
                    rooms: [
                        { id: "entrance", name: "Главный вход", type: "entrance", x: 45, y: 10, width: 15, height: 10, model3d: "https://threejs.org/examples/models/gltf/SheenChair.glb"},
                        { id: "lobby", name: "Вестибюль", type: "hallway", x: 40, y: 25, width: 40, height: 15 },
                        { id: "security", name: "Пост охраны", type: "security", x: 70, y: 10, width: 12, height: 10 },
                        { id: "corridor-left", name: "Коридор к спортзалу", type: "hallway", x: 10, y: 35, width: 30, height: 8 },
                        { id: "gym", name: "Спортивный зал", type: "gym", x: 5, y: 45, width: 35, height: 35 },
                        { id: "cafeteria", name: "Столовая", type: "cafeteria", x: 45, y: 45, width: 30, height: 25 },
                        { id: "corridor-right", name: "Коридор к туалетам", type: "hallway", x: 65, y: 30, width: 25, height: 8 },
                        { id: "toilet-m", name: "Туалет (М)", type: "toilet", x: 75, y: 45, width: 10, height: 10 },
                        { id: "toilet-w", name: "Туалет (Ж)", type: "toilet", x: 85, y: 45, width: 10, height: 10 },
                        { id: "classroom-101", name: "Кабинет 1.1", type: "classroom", x: 60, y: 60, width: 12, height: 12 },
                        { id: "classroom-102", name: "Кабинет 1.2", type: "classroom", x: 75, y: 60, width: 12, height: 12 },
                        { id: "classroom-103", name: "Кабинет 1.3", type: "classroom", x: 90, y: 60, width: 12, height: 12 },
                        { id: "stairs-1", name: "Лестница на 2-3 этаж", type: "stairs", x: 90, y: 30, width: 12, height: 12 },
                        { id: "stairs-main", name: "Главная лестница", type: "stairs", x: 45, y: 75, width: 15, height: 20 }
                    ]
                },
                2: {
                    name: "Второй этаж",
                    description: "Учебные аудитории, библиотека, зона отдыха",
                    rooms: []
                },
                3: {
                    name: "Третий этаж",
                    description: "Компьютерные классы, лаборатории",
                    rooms: []
                }
            },
            roomDetails: {
                "entrance": { name: "Главный вход", description: "Основной вход в колледж. Здесь начинается навигация по учебному корпусу.", hours: "08:30–17:00" },
                "security": { name: "Пост охраны", description: "Контрольно-пропускной пункт. Все посетители должны зарегистрироваться здесь.", equipment: ["Система видеонаблюдения", "Пропускной терминал", "Телефонная связь"], hours: "Круглосуточно", contact: "Охранник" },
                "gym": { name: "Спортивный зал", description: "Просторный зал для занятий физической культурой, расположен слева по коридору от входа.", capacity: "50 человек", equipment: ["Спортивные снаряды", "Мячи", "Гимнастические маты"], hours: "08:30–17:00", contact: "Преподаватель физкультуры" },
                "cafeteria": { name: "Столовая", description: "Помещение для приема пищи. Находится справа от спортзала.", capacity: "80 человек", equipment: ["Столы и стулья", "Раздаточная линия", "Микроволновые печи"], hours: "9:00 - 17:00", contact: "Администратор столовой" },
                "library": { name: "Библиотека", description: "Фонд учебной и художественной литературы. Расположена на 2 этаже.", capacity: "40 человек", equipment: ["Книжные стеллажи", "Читальный зал", "Компьютеры для поиска"], hours: "08:30–17:00", contact: "Библиотекарь" }
            }
        };
    }
    
    init() {
        try {
            this.setupLoadingScreen();
            this.initCanvas();
            this.initThreeD();
            this.setupEventListeners();
            this.setupPanorama();
            this.renderMap();
        } catch(e) {
            console.error('Критическая ошибка инициализации:', e);
        } finally {
            this.completeLoading();
        }
        
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading && loading.style.display !== 'none') {
                console.warn('Принудительное скрытие загрузки по таймауту');
                this.completeLoading();
            }
        }, 5000);
    }
    
    setupLoadingScreen() {
        let progress = 0;
        const progressBar = document.getElementById('loading-progress');
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress > 100) {
                progress = 100;
                clearInterval(interval);
            }
            if (progressBar) progressBar.style.width = progress + '%';
        }, 100);
    }
    
    completeLoading() {
        const loadingScreen = document.getElementById('loading');
        if (!loadingScreen) return;
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            this.showNotification('Система навигации загружена!');
        }, 500);
    }
    
    initCanvas() {
        this.config.canvas = document.getElementById('map-canvas');
        if (!this.config.canvas) return;
        this.config.ctx = this.config.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.setupCanvasEvents();
    }
    
    initThreeD() {
        try {
            const container = document.getElementById('three-canvas');
            if (container) {
                this.threeDManager = new ThreeDManager(container);
                container.style.display = 'none';
            }
        } catch(e) {
            console.error('Ошибка инициализации 3D:', e);
        }
    }
    
    resizeCanvas() {
        const container = document.getElementById('map-wrapper');
        if (!container || !this.config.canvas) return;
        this.config.canvas.width = container.clientWidth;
        this.config.canvas.height = container.clientHeight;
        this.renderMap();
        if (this.threeDManager) this.threeDManager.resize();
        if (window.currentRoom3DViewer) window.currentRoom3DViewer.resize();
    }
    
    setupCanvasEvents() {
        const canvas = this.config.canvas;
        if (!canvas) return;
        canvas.addEventListener('click', (e) => {
            // Клики работают только на 1 этаже (canvas)
            if (this.config.currentFloor !== 1) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            for (const room of this.config.rooms) {
                const roomX = room.x * this.config.scale + this.config.offsetX;
                const roomY = room.y * this.config.scale + this.config.offsetY;
                const roomWidth = room.width * this.config.scale;
                const roomHeight = room.height * this.config.scale;
                if (x >= roomX && x <= roomX + roomWidth && y >= roomY && y <= roomY + roomHeight) {
                    this.selectRoom(room.id);
                    return;
                }
            }
        });
        canvas.addEventListener('mousedown', (e) => {
            if (this.config.currentFloor !== 1) return;
            this.config.isDragging = true;
            this.config.dragStartX = e.clientX;
            this.config.dragStartY = e.clientY;
            this.config.dragStartOffsetX = this.config.offsetX;
            this.config.dragStartOffsetY = this.config.offsetY;
            canvas.style.cursor = 'grabbing';
        });
        canvas.addEventListener('mousemove', (e) => {
            if (!this.config.isDragging || this.config.currentFloor !== 1) return;
            const dx = e.clientX - this.config.dragStartX;
            const dy = e.clientY - this.config.dragStartY;
            this.config.offsetX = this.config.dragStartOffsetX + dx;
            this.config.offsetY = this.config.dragStartOffsetY + dy;
            this.renderMap();
        });
        canvas.addEventListener('mouseup', () => {
            this.config.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        canvas.addEventListener('mouseleave', () => {
            this.config.isDragging = false;
            canvas.style.cursor = 'grab';
        });
        canvas.addEventListener('wheel', (e) => {
            if (this.config.currentFloor !== 1) return;
            e.preventDefault();
            const zoomFactor = 0.1;
            const oldScale = this.config.scale;
            if (e.deltaY < 0) {
                if (this.config.scale < this.config.maxZoom) this.config.scale += zoomFactor;
            } else {
                if (this.config.scale > this.config.minZoom) this.config.scale -= zoomFactor;
            }
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const worldX = (mouseX - this.config.offsetX) / oldScale;
            const worldY = (mouseY - this.config.offsetY) / oldScale;
            this.config.offsetX = mouseX - worldX * this.config.scale;
            this.config.offsetY = mouseY - worldY * this.config.scale;
            this.updateZoomDisplay();
            this.renderMap();
        });
    }
    
    setupEventListeners() {
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const floor = parseInt(btn.dataset.floor);
                this.switchFloor(floor);
            });
        });
        document.querySelectorAll('.quick-nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const roomId = btn.dataset.room;
                this.selectRoom(roomId);
            });
        });
        document.getElementById('view-3d').addEventListener('click', () => this.switchViewMode('3d'));
        document.getElementById('view-top').addEventListener('click', () => this.switchViewMode('top'));
        document.getElementById('view-panorama').addEventListener('click', () => this.switchViewMode('panorama'));
        document.getElementById('close-panorama').addEventListener('click', () => this.exitPanorama());
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view').addEventListener('click', () => this.resetView());
        document.getElementById('nav-up').addEventListener('click', () => this.move('up'));
        document.getElementById('nav-down').addEventListener('click', () => this.move('down'));
        document.getElementById('nav-left').addEventListener('click', () => this.move('left'));
        document.getElementById('nav-right').addEventListener('click', () => this.move('right'));
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('search-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') this.performSearch(); });
        document.getElementById('build-route-btn').addEventListener('click', () => this.buildRoute());
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
        document.getElementById('help-btn').addEventListener('click', () => this.showHelp());
        document.getElementById('feedback-btn').addEventListener('click', () => this.showFeedback());
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });
        document.getElementById('feedback-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitFeedback();
        });
        const loadBtn = document.getElementById('load-model-btn');
        const fileInput = document.getElementById('model-file-input');
        if (loadBtn && fileInput) {
            loadBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && this.threeDManager) {
                    this.threeDManager.loadModelFromFile(file);
                }
            });
        }
        this.setupKeyboardControls();
    }
    
    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key === '1') this.switchFloor(1);
            if (e.key === '2') this.switchFloor(2);
            if (e.key === '3') this.switchFloor(3);
            if (e.key === 'ArrowUp' || e.key === 'w') this.move('up');
            if (e.key === 'ArrowDown' || e.key === 's') this.move('down');
            if (e.key === 'ArrowLeft' || e.key === 'a') this.move('left');
            if (e.key === 'ArrowRight' || e.key === 'd') this.move('right');
            if (e.key === '+' || e.key === '=') this.zoomIn();
            if (e.key === '-' || e.key === '_') this.zoomOut();
            if (e.key === 'Escape' && this.config.isPanoramaActive) this.exitPanorama();
        });
    }
    
    setupPanorama() {
        document.getElementById('pano-left').addEventListener('click', () => this.panPanorama('left'));
        document.getElementById('pano-right').addEventListener('click', () => this.panPanorama('right'));
        document.getElementById('pano-up').addEventListener('click', () => this.panPanorama('up'));
        document.getElementById('pano-down').addEventListener('click', () => this.panPanorama('down'));
        document.getElementById('pano-zoom-in').addEventListener('click', () => this.zoomPanorama('in'));
        document.getElementById('pano-zoom-out').addEventListener('click', () => this.zoomPanorama('out'));
    }
    
   renderMap() {
    const canvasEl = this.config.canvas;
    const imgEl = document.getElementById('floor-image');
    
    // Все этажи (1, 2, 3) теперь показывают картинки
    if (this.config.currentFloor === 1 || this.config.currentFloor === 2 || this.config.currentFloor === 3) {
        if (canvasEl) canvasEl.style.display = 'none';
        if (imgEl) {
            imgEl.style.display = 'block';
            let src = '';
            if (this.config.currentFloor === 1) src = 'ChatGPT Image 24 мая 2026 г., 18_00_42.png';
            else if (this.config.currentFloor === 2) src = 'cdf6ceb9-059c-45ae-b9e4-add3429858a2.jfif';
            else if (this.config.currentFloor === 3) src = '5aea71fa-789a-4529-9410-d6c5a23cc374.png';
            if (imgEl.src !== src) imgEl.src = src;
        }
        return;
}
        
        if (isImageFloor) {
            if (canvasEl) canvasEl.style.display = 'none';
            if (imgEl) {
                imgEl.style.display = 'block';
                let src = '';
                if (this.config.currentFloor === 2) src = 'cdf6ceb9-059c-45ae-b9e4-add3429858a2.jfif';
                else if (this.config.currentFloor === 3) src = '5aea71fa-789a-4529-9410-d6c5a23cc374.png';
                if (imgEl.src !== src) imgEl.src = src;
            }
        } else {
            if (canvasEl) canvasEl.style.display = 'block';
            if (imgEl) imgEl.style.display = 'none';
            if (!this.config.ctx || !this.config.canvas) return;
            const ctx = this.config.ctx;
            const canvas = this.config.canvas;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            const currentFloor = this.collegeData.floorPlan[this.config.currentFloor];
            if (!currentFloor) return;
            this.config.rooms = currentFloor.rooms;
            this.renderRooms();
            this.renderGrid();
        }
    }
    
    renderRooms() {
        const ctx = this.config.ctx;
        this.config.rooms.forEach(room => {
            const x = room.x * this.config.scale + this.config.offsetX;
            const y = room.y * this.config.scale + this.config.offsetY;
            const width = room.width * this.config.scale;
            const height = room.height * this.config.scale;
            let fillColor, strokeColor, icon;
            switch(room.type) {
                case 'entrance': fillColor = 'rgba(16, 185, 129, 0.8)'; strokeColor = '#10b981'; icon = '🚪'; break;
                case 'security': fillColor = 'rgba(245, 158, 11, 0.8)'; strokeColor = '#f59e0b'; icon = '🛡️'; break;
                case 'classroom': fillColor = 'rgba(59, 130, 246, 0.8)'; strokeColor = '#3b82f6'; icon = '📚'; break;
                case 'computer': fillColor = 'rgba(139, 92, 246, 0.8)'; strokeColor = '#8b5cf6'; icon = '💻'; break;
                case 'lab': fillColor = 'rgba(239, 68, 68, 0.8)'; strokeColor = '#ef4444'; icon = '🔬'; break;
                case 'gym': fillColor = 'rgba(239, 68, 68, 0.8)'; strokeColor = '#ef4444'; icon = '🏋️'; break;
                case 'cafeteria': fillColor = 'rgba(249, 115, 22, 0.8)'; strokeColor = '#f97316'; icon = '🍽️'; break;
                case 'toilet': fillColor = 'rgba(107, 114, 128, 0.8)'; strokeColor = '#6b7280'; icon = '🚻'; break;
                case 'library': fillColor = 'rgba(16, 185, 129, 0.8)'; strokeColor = '#10b981'; icon = '📖'; break;
                case 'stairs': fillColor = 'rgba(139, 92, 246, 0.8)'; strokeColor = '#8b5cf6'; icon = '🪜'; break;
                case 'hallway': fillColor = 'rgba(255, 255, 255, 0.05)'; strokeColor = 'rgba(255, 255, 255, 0.3)'; icon = ''; break;
                default: fillColor = 'rgba(100, 100, 100, 0.8)'; strokeColor = '#666'; icon = '';
            }
            if (this.config.selectedRoom === room.id) {
                strokeColor = '#fbbf24';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 15;
            }
            ctx.save();
            const borderRadius = Math.min(8, width * 0.1);
            ctx.fillStyle = fillColor;
            this.roundRect(ctx, x, y, width, height, borderRadius);
            ctx.fill();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.shadowBlur = 0;
            const minWidthForText = 40;
            const minHeightForText = 30;
            if (width >= minWidthForText && height >= minHeightForText) {
                ctx.fillStyle = 'white';
                ctx.font = `bold ${Math.max(10, 12 * this.config.scale)}px Inter`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
                ctx.shadowBlur = 2;
                let displayName = room.name;
                const maxChars = Math.floor(width / (ctx.measureText('M').width));
                if (displayName.length > maxChars) displayName = displayName.substring(0, Math.max(3, maxChars - 3)) + '...';
                ctx.fillText(displayName, x + width/2, y + height/2);
                ctx.shadowColor = 'transparent';
            }
            if (icon && (width < minWidthForText || height < minHeightForText || room.type === 'hallway')) {
                ctx.font = `${Math.max(16, Math.min(24, width/2))}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(icon, x + width/2, y + height/2);
            }
            ctx.restore();
        });
    }
    
    renderGrid() {
        const ctx = this.config.ctx;
        const canvas = this.config.canvas;
        if (this.config.scale > 1.5) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            const gridSize = 20 * this.config.scale;
            const startX = Math.floor(-this.config.offsetX / gridSize) * gridSize;
            const startY = Math.floor(-this.config.offsetY / gridSize) * gridSize;
            for (let x = startX; x < canvas.width; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            for (let y = startY; y < canvas.height; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            ctx.restore();
        }
    }
    
    roundRect(ctx, x, y, width, height, radius) {
        if (width < 2 * radius) radius = width / 2;
        if (height < 2 * radius) radius = height / 2;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + width, y, x + width, y + height, radius);
        ctx.arcTo(x + width, y + height, x, y + height, radius);
        ctx.arcTo(x, y + height, x, y, radius);
        ctx.arcTo(x, y, x + width, y, radius);
        ctx.closePath();
    }
    
    switchFloor(floor) {
        if (floor < 1 || floor > 3) return;
        this.config.currentFloor = floor;
        document.getElementById('current-floor-number').textContent = floor;
        document.getElementById('current-floor-label').textContent = `${floor} этаж`;
        document.querySelectorAll('.floor-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.floor) === floor) btn.classList.add('active');
        });
        this.config.selectedRoom = null;
        this.resetView();
        this.updateRoomInfo();
        this.updateSchedule();
        const floorName = this.collegeData.floorPlan[floor].name;
        this.showNotification(`Переключено на ${floor} этаж: ${floorName}`);
        this.renderMap();
    }
    
    selectRoom(roomId) {
        this.config.selectedRoom = roomId;
        const currentFloor = this.collegeData.floorPlan[this.config.currentFloor];
        const room = currentFloor.rooms.find(r => r.id === roomId);
        if (!room) return;
        if (this.config.currentFloor === 1) this.centerOnRoom(room);
        this.updateRoomInfo();
        this.updateSchedule();
        this.updateCurrentLocation(room);
        this.showNotification(`Выбрано: ${room.name}`);
    }
    
    centerOnRoom(room) {
        const canvas = this.config.canvas;
        const roomCenterX = (room.x + room.width / 2) * this.config.scale;
        const roomCenterY = (room.y + room.height / 2) * this.config.scale;
        this.config.offsetX = canvas.width / 2 - roomCenterX;
        this.config.offsetY = canvas.height / 2 - roomCenterY;
        this.renderMap();
    }
    
    updateRoomInfo() {
        const infoElement = document.getElementById('room-info');
        if (!this.config.selectedRoom) {
            infoElement.innerHTML = `<div class="no-selection"><i class="fas fa-door-open"></i><p>Выберите помещение на карте для просмотра информации</p></div>`;
            return;
        }
        const roomId = this.config.selectedRoom;
        const roomDetails = this.collegeData.roomDetails[roomId] || {};
        const currentFloor = this.collegeData.floorPlan[this.config.currentFloor];
        const room = currentFloor.rooms.find(r => r.id === roomId);
        let infoHTML = `<div class="selected-room"><h4>${room ? room.name : roomDetails.name || roomId}</h4><p class="room-description">${roomDetails.description || 'Информация о помещении'}</p><div class="room-details">`;
        if (roomDetails.capacity) infoHTML += `<div class="detail-item"><i class="fas fa-users"></i><span>Вместимость: ${roomDetails.capacity}</span></div>`;
        if (roomDetails.hours) infoHTML += `<div class="detail-item"><i class="fas fa-clock"></i><span>Часы работы: ${roomDetails.hours}</span></div>`;
        if (roomDetails.contact) infoHTML += `<div class="detail-item"><i class="fas fa-user-tie"></i><span>Контакт: ${roomDetails.contact}</span></div>`;
        infoHTML += `</div>`;
        if (roomDetails.equipment && roomDetails.equipment.length > 0) {
            infoHTML += `<div class="equipment"><h5>Оборудование:</h5><div class="equipment-list">${roomDetails.equipment.map(item => `<span class="equipment-tag">${item}</span>`).join('')}</div></div>`;
        }
        infoHTML += `<div class="room-actions"><button class="action-btn" onclick="collegeMapApp.showPanorama()"><i class="fas fa-street-view"></i> Панорамный обзор</button></div></div>`;
        infoElement.innerHTML = infoHTML;
    }
    
    updateSchedule() {
        const scheduleElement = document.getElementById('schedule-items');
        if (!this.config.selectedRoom) {
            scheduleElement.innerHTML = `<div class="no-schedule"><i class="fas fa-clock"></i><p>Расписание появится при выборе аудитории</p></div>`;
            return;
        }
        scheduleElement.innerHTML = `<div class="day-schedule"><div class="schedule-item"><span class="time">9:00 - 10:30</span><span class="subject">Информатика</span><span class="group">Группа ПНГ-401</span></div><div class="schedule-item"><span class="time">10:45 - 12:15</span><span class="subject">Математика</span><span class="group">Группа ПНГ-401</span></div><div class="schedule-item"><span class="time">13:00 - 14:30</span><span class="subject">Педагогика</span><span class="group">Группа ПНГ-402</span></div></div>`;
    }
    
    updateCurrentLocation(room) {
        document.getElementById('current-location-name').textContent = room.name;
        document.getElementById('current-location-floor').textContent = `${this.config.currentFloor} этаж`;
    }
    
    switchViewMode(mode) {
        this.config.viewMode = mode;
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === mode) btn.classList.add('active');
        });
        const mapWrapper = document.getElementById('map-wrapper');
        const panoramaViewer = document.getElementById('panorama-viewer');
        const threeCanvas = document.getElementById('three-canvas');
        if (mode === 'panorama') {
            if (!this.config.selectedRoom) {
                this.showNotification('Выберите помещение для панорамного обзора');
                document.querySelector('[data-view="3d"]').classList.add('active');
                return;
            }
            mapWrapper.style.display = 'none';
            if (threeCanvas) threeCanvas.style.display = 'none';
            panoramaViewer.style.display = 'block';
            this.config.isPanoramaActive = true;
        } else if (mode === '3d') {
            mapWrapper.style.display = 'none';
            panoramaViewer.style.display = 'none';
            if (threeCanvas) threeCanvas.style.display = 'block';
            this.config.isPanoramaActive = false;
            if (this.threeDManager) {
                this.threeDManager.startAnimation();
                this.threeDManager.resetCamera();
            }
        } else {
            mapWrapper.style.display = 'block';
            panoramaViewer.style.display = 'none';
            if (threeCanvas) threeCanvas.style.display = 'none';
            this.config.isPanoramaActive = false;
            this.renderMap();
        }
    }
    
    showPanorama() {
        if (!this.config.selectedRoom) {
            this.showNotification('Сначала выберите помещение на карте');
            return;
        }
        const currentFloor = this.collegeData.floorPlan[this.config.currentFloor];
        const room = currentFloor.rooms.find(r => r.id === this.config.selectedRoom);
        if (!room) return;
        
        document.getElementById('panorama-title').textContent = room.name;
        const roomDetails = this.collegeData.roomDetails[this.config.selectedRoom] || {};
        document.getElementById('panorama-description').textContent = roomDetails.description || 'Панорамный обзор помещения';
        
        const panoramaContainer = document.getElementById('panorama-display');
        this.switchViewMode('panorama');
        
        if (window.currentRoom3DViewer) {
            window.currentRoom3DViewer.destroy();
            window.currentRoom3DViewer = null;
        }
        if (typeof PanoramaViewer !== 'undefined' && PanoramaViewer.destroy) {
            PanoramaViewer.destroy();
        }
        
        if (room.model3d) {
            console.log('Обнаружена 3D-модель для комнаты, путь:', room.model3d);
            panoramaContainer.innerHTML = '';
            const viewer = new Room3DViewer(panoramaContainer);
            viewer.loadModel(room.model3d);
            window.currentRoom3DViewer = viewer;
        } else {
            panoramaContainer.innerHTML = `<div class="panorama-placeholder"><i class="fas fa-image"></i><p>Модуль панорам не загружен или модель отсутствует</p></div>`;
        }
    }
    
    exitPanorama() {
        if (window.currentRoom3DViewer) {
            window.currentRoom3DViewer.destroy();
            window.currentRoom3DViewer = null;
        }
        if (typeof PanoramaViewer !== 'undefined') PanoramaViewer.destroy();
        this.switchViewMode('3d');
    }
    
    panPanorama(direction) {
        const panoramaDisplay = document.querySelector('.panorama-placeholder');
        if (!panoramaDisplay) return;
        let transform = panoramaDisplay.style.transform || 'rotateX(0deg) rotateY(0deg)';
        const matchX = transform.match(/rotateX\(([-+]?\d*\.?\d+)deg\)/);
        const matchY = transform.match(/rotateY\(([-+]?\d*\.?\d+)deg\)/);
        let angleX = matchX ? parseFloat(matchX[1]) : 0;
        let angleY = matchY ? parseFloat(matchY[1]) : 0;
        switch(direction) {
            case 'left': angleY -= 15; break;
            case 'right': angleY += 15; break;
            case 'up': angleX = Math.max(-60, angleX - 15); break;
            case 'down': angleX = Math.min(60, angleX + 15); break;
        }
        panoramaDisplay.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    }
    
    zoomPanorama(action) {
        const panoramaDisplay = document.querySelector('.panorama-placeholder');
        if (!panoramaDisplay) return;
        let scale = parseFloat(panoramaDisplay.style.scale) || 1;
        if (action === 'in') scale = Math.min(3, scale * 1.2);
        else scale = Math.max(0.5, scale * 0.8);
        panoramaDisplay.style.scale = scale;
    }
    
    move(direction) {
        if (this.config.currentFloor !== 1) return;
        const moveDistance = 30 / this.config.scale;
        switch(direction) {
            case 'up': this.config.offsetY += moveDistance; break;
            case 'down': this.config.offsetY -= moveDistance; break;
            case 'left': this.config.offsetX += moveDistance; break;
            case 'right': this.config.offsetX -= moveDistance; break;
        }
        this.renderMap();
    }
    
    zoomIn() {
        if (this.config.currentFloor !== 1) return;
        if (this.config.scale < this.config.maxZoom) {
            this.config.scale *= 1.2;
            this.updateZoomDisplay();
            this.renderMap();
        }
    }
    
    zoomOut() {
        if (this.config.currentFloor !== 1) return;
        if (this.config.scale > this.config.minZoom) {
            this.config.scale *= 0.8;
            this.updateZoomDisplay();
            this.renderMap();
        }
    }
    
    updateZoomDisplay() {
        document.getElementById('zoom-level').textContent = Math.round(this.config.scale * 100) + '%';
    }
    
    resetView() {
        if (this.config.currentFloor === 1) {
            const canvas = this.config.canvas;
            if (!canvas) return;
            this.config.scale = 1.5;
            this.config.offsetX = canvas.width / 2 - 50 * this.config.scale;
            this.config.offsetY = canvas.height / 2 - 50 * this.config.scale;
            this.updateZoomDisplay();
            this.renderMap();
        }
        if (this.threeDManager) this.threeDManager.resetCamera();
    }
    
    performSearch() {
        const query = document.getElementById('search-input').value.trim().toLowerCase();
        if (!query) { this.showNotification('Введите поисковый запрос'); return; }
        let foundRoom = null, foundFloor = null;
        for (let floor = 1; floor <= 3; floor++) {
            const rooms = this.collegeData.floorPlan[floor].rooms;
            const room = rooms.find(r => r.name.toLowerCase().includes(query) || r.id.toLowerCase().includes(query));
            if (room) { foundRoom = room; foundFloor = floor; break; }
        }
        if (foundRoom) {
            if (foundFloor !== this.config.currentFloor) {
                this.switchFloor(foundFloor);
                setTimeout(() => this.selectRoom(foundRoom.id), 300);
            } else this.selectRoom(foundRoom.id);
            document.getElementById('search-input').value = '';
        } else this.showNotification(`Ничего не найдено по запросу: "${query}"`);
    }
    
    buildRoute() {
        const fromLocation = document.getElementById('from-location').value;
        const toLocation = document.getElementById('to-location').value;
        if (!fromLocation || !toLocation) { this.showNotification('Выберите начальную и конечную точки'); return; }
        if (fromLocation === toLocation) { this.showNotification('Начальная и конечная точки должны быть разными'); return; }
        this.showNotification(`Маршрут построен: от "${fromLocation}" до "${toLocation}"`);
        document.getElementById('from-location').value = '';
        document.getElementById('to-location').value = '';
    }
    
    toggleFullscreen() {
        const elem = document.documentElement;
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
            else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-compress"></i>';
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
            document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-expand"></i>';
        }
    }
    
    showHelp() { document.getElementById('help-modal').style.display = 'flex'; }
    showFeedback() { document.getElementById('feedback-modal').style.display = 'flex'; }
    closeModals() { document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none'); }
    
    submitFeedback() {
        const name = document.getElementById('feedback-name').value;
        const email = document.getElementById('feedback-email').value;
        const message = document.getElementById('feedback-message').value;
        if (!message.trim()) { this.showNotification('Введите сообщение'); return; }
        console.log('Отправка обратной связи:', { name, email, message });
        this.showNotification('Спасибо за ваш отзыв! Сообщение отправлено.');
        this.closeModals();
        document.getElementById('feedback-form').reset();
    }
    
    showNotification(message, duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        notificationText.textContent = message;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), duration);
    }
}

let collegeMapApp;
document.addEventListener('DOMContentLoaded', () => {
    collegeMapApp = new CollegeMapApp();
    window.collegeMapApp = collegeMapApp;
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    });
    document.querySelectorAll('.schedule-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.schedule-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});