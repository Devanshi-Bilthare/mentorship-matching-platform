document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.getElementById('navbar');
    
    const token = localStorage.getItem("token");

    if (token) {
        navbar.innerHTML = `
            <nav class="navbar">
                <ul class="nav-links">
                    <li><i class="fa-solid fa-user"></i><a href="profile.html">Profile</a> </li>
                    <li><i class="fa-solid fa-sign-out-alt"></i><a href="javascript:void(0);" id="logoutBtn">Logout</a></li>
                    <li><i class="fa-solid fa-magnifying-glass"></i><a href="explore.html">Explore</a></li>
                    
                </ul>
            </nav>
        `;

        const logoutBtn = document.getElementById("logoutBtn");
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");  
            alert("Logged out successfully");
            window.location.href = "index.html";  
        });
    } else {
        navbar.innerHTML = `
            <nav class="navbar">
                <ul class="nav-links">
                    <li><i class="fa-solid fa-user"></i><a href="profile.html">Profile</a> </li>
                    <li><i class="fas fa-lock"></i><a href="index.html">Login</a></li>
                    <li><i class="fa-solid fa-magnifying-glass"></i><a href="explore.html">Explore</a></li>
                </ul>
            </nav>
        `;
    }
});
