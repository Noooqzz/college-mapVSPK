// panorama.js – 15 готовых блоков для панорам (просто замените имена файлов)
document.addEventListener("DOMContentLoaded", () => {
    const scenes = [
        { id: "scene_01", panorama: "Вход.jpg", title: "Вход" },
        { id: "scene_02", panorama: "Столовая.jpg", title: "Столовая" },
        { id: "scene_03", panorama: "Лестница 1 этаж.jpg", title: "Лестница 1 этаж" },
        { id: "scene_04", panorama: "Лестница 2 этаж.jpg", title: "Лестница 2 этаж" },
        { id: "scene_05", panorama: "2 этаж холл.jpg", title: "2 этаж коридор" },
        { id: "scene_06", panorama: "3.10.JPG", title: "3.10" },
        { id: "scene_07", panorama: "3.16.jpg", title: "3.16" },
        { id: "scene_08", panorama: "3.11.jpg", title: "3.11" },
        { id: "scene_09", panorama: "3 ЭТАЖ.jpg", title: "3 этаж " },
        { id: "scene_10", panorama: "pano10.jpg", title: "Панорама 10" },
        { id: "scene_11", panorama: "pano11.jpg", title: "Панорама 11" },
        { id: "scene_12", panorama: "pano12.jpg", title: "Панорама 12" },
        { id: "scene_13", panorama: "pano13.jpg", title: "Панорама 13" },
        { id: "scene_14", panorama: "pano14.jpg", title: "Панорама 14" },
        { id: "scene_15", panorama: "pano15.jpg", title: "Панорама 15" }
    ];

    const openBtn = document.getElementById("open-panorama-btn");
    const modal = document.getElementById("panorama-modal");
    let viewer = null;
    let currentSceneId = scenes[0]?.id || null;

    function createPanel() {
        const panel = document.createElement("div");
        panel.id = "panorama-controls-panel";
        panel.style.cssText = `
            position: absolute;
            bottom: 20px;
            left: 20px;
            right: 20px;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(12px);
            border-radius: 60px;
            padding: 8px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.2);
        `;

        const prevBtn = document.createElement("button");
        prevBtn.innerHTML = "◀";
        prevBtn.title = "Предыдущая";
        prevBtn.style.cssText = `
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 28px;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.2s;
        `;
        prevBtn.onmouseenter = () => prevBtn.style.background = "#3b82f6";
        prevBtn.onmouseleave = () => prevBtn.style.background = "rgba(255,255,255,0.2)";
        prevBtn.onclick = () => navigate(-1);

        const titleSpan = document.createElement("span");
        titleSpan.id = "current-pano-title";
        titleSpan.style.cssText = `
            font-size: 18px;
            font-weight: 600;
            color: white;
            text-shadow: 0 1px 2px black;
            flex: 1;
            text-align: center;
        `;
        titleSpan.textContent = getTitle(currentSceneId);

        const thumbsContainer = document.createElement("div");
        thumbsContainer.style.cssText = `
            display: flex;
            gap: 12px;
            overflow-x: auto;
            scrollbar-width: thin;
            padding: 4px 0;
            flex: 2;
            justify-content: center;
        `;
        thumbsContainer.classList.add("pano-thumbs");

        scenes.forEach(scene => {
            const btn = document.createElement("button");
            btn.textContent = scene.title;
            btn.dataset.id = scene.id;
            btn.style.cssText = `
                background: ${currentSceneId === scene.id ? "#3b82f6" : "rgba(255,255,255,0.2)"};
                border: none;
                border-radius: 40px;
                padding: 6px 18px;
                color: white;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s;
            `;
            btn.onmouseenter = () => btn.style.background = "#3b82f6";
            btn.onmouseleave = () => {
                if (scene.id !== currentSceneId) btn.style.background = "rgba(255,255,255,0.2)";
                else btn.style.background = "#3b82f6";
            };
            btn.onclick = () => {
                if (viewer && scene.id !== currentSceneId) {
                    viewer.loadScene(scene.id);
                    currentSceneId = scene.id;
                    updateActive(scene.id);
                    titleSpan.textContent = scene.title;
                }
            };
            thumbsContainer.appendChild(btn);
        });

        const nextBtn = document.createElement("button");
        nextBtn.innerHTML = "▶";
        nextBtn.title = "Следующая";
        nextBtn.style.cssText = prevBtn.style.cssText;
        nextBtn.onmouseenter = () => nextBtn.style.background = "#3b82f6";
        nextBtn.onmouseleave = () => nextBtn.style.background = "rgba(255,255,255,0.2)";
        nextBtn.onclick = () => navigate(1);

        panel.appendChild(prevBtn);
        panel.appendChild(titleSpan);
        panel.appendChild(thumbsContainer);
        panel.appendChild(nextBtn);
        return panel;
    }

    function updateActive(activeId) {
        document.querySelectorAll(".pano-thumbs button").forEach(btn => {
            btn.style.background = btn.dataset.id === activeId ? "#3b82f6" : "rgba(255,255,255,0.2)";
        });
    }

    function getTitle(id) {
        const scene = scenes.find(s => s.id === id);
        return scene ? scene.title : "Панорама";
    }

    function getIndex(id) {
        return scenes.findIndex(s => s.id === id);
    }

    function navigate(delta) {
        if (!viewer) return;
        let newIdx = getIndex(currentSceneId) + delta;
        if (newIdx < 0) newIdx = scenes.length - 1;
        if (newIdx >= scenes.length) newIdx = 0;
        const newScene = scenes[newIdx];
        if (newScene && newScene.id !== currentSceneId) {
            viewer.loadScene(newScene.id);
            currentSceneId = newScene.id;
            updateActive(currentSceneId);
            document.getElementById("current-pano-title").textContent = newScene.title;
        }
    }

    function buildConfig() {
        const scenesConfig = {};
        scenes.forEach(scene => {
            scenesConfig[scene.id] = {
                type: "equirectangular",
                panorama: scene.panorama,
                title: scene.title,
                hotSpots: []
            };
        });
        return {
            default: { firstScene: scenes[0]?.id, autoLoad: true, showZoomCtrl: true, showFullscreenCtrl: true, compass: true },
            scenes: scenesConfig
        };
    }

    function openPanorama() {
        if (!modal) return;
        modal.classList.add("active");
        modal.style.display = "flex";

        if (!viewer) {
            viewer = pannellum.viewer("panorama-viewer", buildConfig());
            viewer.on("scenechange", (newId) => {
                currentSceneId = newId;
                updateActive(currentSceneId);
                const span = document.getElementById("current-pano-title");
                if (span) span.textContent = getTitle(currentSceneId);
            });
        } else {
            viewer.loadScene(currentSceneId);
        }

        if (!document.getElementById("panorama-controls-panel")) {
            const panel = createPanel();
            const modalContent = modal.querySelector(".modal-content") || modal;
            modalContent.style.position = "relative";
            modalContent.appendChild(panel);
        }
    }

    function closePanorama() {
        if (modal) {
            modal.classList.remove("active");
            modal.style.display = "none";
        }
    }

    openBtn?.addEventListener("click", openPanorama);
    const closeBtn = modal?.querySelector(".modal-close") || document.getElementById("close-panorama-btn");
    closeBtn?.addEventListener("click", closePanorama);
    modal?.addEventListener("click", (e) => { if (e.target === modal) closePanorama(); });

    document.addEventListener("keydown", (e) => {
        if (modal && modal.style.display === "flex") {
            if (e.key === "ArrowLeft") navigate(-1);
            if (e.key === "ArrowRight") navigate(1);
            if (e.key === "Escape") closePanorama();
        }
    });

    const style = document.createElement("style");
    style.textContent = `
        .pano-thumbs::-webkit-scrollbar { height: 4px; }
        .pano-thumbs::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .pano-thumbs::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; }
        #panorama-controls-panel button:active { transform: scale(0.96); }
    `;
    document.head.appendChild(style);
});