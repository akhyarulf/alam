/* ==========================================================
   Alam v1.0
   loader.js

   Loading Screen Controller
========================================================== */

"use strict";

const Loader = {

    element: null,

    initialized: false,

    visible: true,

    delay: 300,

    init() {

        this.element = document.getElementById("loader");

        if (!this.element) {

            console.warn("Loader element not found.");

            return;

        }

        this.initialized = true;

        this.show();

    },

    show(text = "Loading Route...", subtitle = "Mengambil data dari Alam") {

        if (!this.initialized) {

            this.init();

        }

        if (!this.element) return;

        const title = this.element.querySelector("h3");
        const desc = this.element.querySelector("p");

        if (title) title.textContent = text;
        if (desc) desc.textContent = subtitle;

        this.element.classList.remove("hidden");
        this.element.style.display = "flex";
        this.element.style.opacity = "1";

        this.visible = true;

    },

    async hide() {

        if (!this.element) return;

        await Utils.sleep(this.delay);

        this.element.style.transition = "opacity .35s ease";

        this.element.style.opacity = "0";

        setTimeout(() => {

            this.element.style.display = "none";

            this.element.classList.add("hidden");

        }, 350);

        this.visible = false;

    },

    async update(text, subtitle = "") {

        if (!this.element) return;

        const title = this.element.querySelector("h3");
        const desc = this.element.querySelector("p");

        if (title) title.textContent = text;

        if (desc && subtitle !== "")
            desc.textContent = subtitle;

        await Utils.sleep(80);

    },

    async progress(step, total, text = "Loading...") {

        const percent = Math.round((step / total) * 100);

        await this.update(

            `${text} (${percent}%)`,

            `Step ${step} / ${total}`

        );

    },
	
    /* ==========================================================
       Error
    ========================================================== */

    async error(message = "Terjadi kesalahan.") {

        if (!this.element)
            return;

        await this.show(

            "Oops!",

            message

        );

    },

    /* ==========================================================
       Reset
    ========================================================== */

    reset() {

        if (!this.element)
            return;

        const title = this.element.querySelector("h3");
        const desc = this.element.querySelector("p");

        if (title)
            title.textContent = "Loading Route...";

        if (desc)
            desc.textContent = "Mengambil data dari Alam";

        this.element.style.opacity = "1";

        this.element.style.display = "flex";

        this.visible = true;

    },

    /* ==========================================================
       Visible
    ========================================================== */

    isVisible() {

        return this.visible;

    },

    /* ==========================================================
       Destroy
    ========================================================== */

    destroy() {

        if (!this.element)
            return;

        this.element.remove();

        this.element = null;

        this.visible = false;

        this.initialized = false;

    }

};


/* ==========================================================
   DOM Ready
========================================================== */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        Loader.init();

    }

);


/* ==========================================================
   Export
========================================================== */

window.Loader = Loader;


/* ==========================================================
   Ready
========================================================== */

