const body = document.querySelector("body"),
    sidebar = body.querySelector("nav");
sidebarToggle = body.querySelector(".sidebar-toggle");

// Get sidebar status from localStorage
let getStatus = localStorage.getItem("status");
if(getStatus && getStatus === "close"){
    sidebar.classList.add("close");
}

// Toggle sidebar
sidebarToggle.addEventListener("click", () => {
    sidebar.classList.toggle("close");

    if(sidebar.classList.contains("close")){
        localStorage.setItem("status", "close");
    } else {
        localStorage.setItem("status", "open");
    }
});

// Set active menu item
document.addEventListener("DOMContentLoaded", function() {
    const navLinks = document.querySelectorAll(".nav-links li a");

    navLinks.forEach(link => {
        link.addEventListener("click", function() {
            navLinks.forEach(item => item.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Set dashboard as active by default
    const currentPath = window.location.pathname;
    if(currentPath.endsWith("index.html") || currentPath.endsWith("/")) {
        navLinks[0].classList.add("active");
    }
});

// Simulate data loading
document.addEventListener("DOMContentLoaded", function() {
    // You would replace this with actual API calls in a real application
    setTimeout(() => {
        const loadingElements = document.querySelectorAll(".skeleton");
        loadingElements.forEach(el => {
            el.classList.remove("skeleton");
        });
    }, 1500);
});
// Replace the existing nav link click handler with this new implementation
document.addEventListener("DOMContentLoaded", function () {
    const navLinks = document.querySelectorAll(".nav-links li a");
    const modal = document.getElementById("page-modal");
    const modalFrame = document.getElementById("modal-frame");
    const closeButton = document.getElementById("close-modal");
    const modalTitle = document.querySelector(".modal-title");
    const modalOverlay = document.createElement("div");
    modalOverlay.classList.add("modal-overlay");
    document.body.appendChild(modalOverlay);

    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const page = this.getAttribute("data-page");
            const pageName = this.querySelector(".link-name").textContent;

            if (page) {
                // Set iframe source and title
                modalFrame.src = page;
                modalTitle.textContent = pageName;

                // Open the modal with animation
                modal.classList.add("open");
                modalOverlay.classList.add("active");

                // Disable body scrolling
                document.body.style.overflow = "hidden";
            }

            // Highlight active link
            navLinks.forEach(item => item.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Close modal when close button is clicked
    closeButton.addEventListener("click", function() {
        modal.classList.remove("open");
        modalOverlay.classList.remove("active");
        document.body.style.overflow = "auto";

        // Reset iframe source when closed
        setTimeout(() => {
            modalFrame.src = "";
        }, 500);
    });

    // Close modal when clicking outside content
    modalOverlay.addEventListener("click", function() {
        closeButton.click();
    });
});