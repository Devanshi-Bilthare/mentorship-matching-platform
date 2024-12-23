document.addEventListener("DOMContentLoaded", () => {
    const profilesList = document.getElementById("profilesList");
    const roleFilter = document.getElementById("roleFilter");
    const skillFilter = document.getElementById("skillFilter");
    const interestFilter = document.getElementById("interestFilter");
    const applyFilters = document.getElementById("applyFilters");

    const loggedInUserId = localStorage.getItem('userId'); 

    const renderProfiles = (filteredUsers) => {
        profilesList.innerHTML = ""; 
        if (filteredUsers.length === 0) {
            profilesList.innerHTML = "<p>No profiles found.</p>";
            return;
        }

        filteredUsers.forEach(user => {
            if (user.id == loggedInUserId) return;
            const profileCard = document.createElement("div");
            profileCard.classList.add("profile-card");

            profileCard.innerHTML = `
                <div class="profile-details">
                    <h3>${user.name}</h3>
                    <p><strong>Role:</strong> ${user.role || "NA"}</p>
                    <p><strong>Skills:</strong> ${user.skills || "NA"}</p>
                    <p><strong>Interests:</strong> ${user.interests || "NA"}</p>
                </div>
                <button class="send-request-btn" data-id="${user.id}">
                    Send Request
                </button>
            `;

            profilesList.appendChild(profileCard);
        });

        const requestButtons = document.querySelectorAll(".send-request-btn");
        requestButtons.forEach(button => {
            button.addEventListener("click", (e) => {
                const userId = e.target.dataset.id;
                sendRequest(userId);
            });
        });
    };

    const filterUsers = (users) => {
        const roleValue = roleFilter.value.toLowerCase();
        const skillValue = skillFilter.value.toLowerCase();
        const interestValue = interestFilter.value.toLowerCase();
    
        const filteredUsers = users.filter(user => {
            const roleMatch = roleValue === "all" || user?.role?.toLowerCase() === roleValue;
    
            const userSkills = Array.isArray(user.skills) ? user.skills.join(",").toLowerCase() : (user.skills || "").toLowerCase();
            const skillMatch = skillValue === "" || skillValue.split(",").every(skill => userSkills.includes(skill.trim()));
    
            const userInterests = Array.isArray(user.interests) ? user.interests.join(",").toLowerCase() : (user.interests || "").toLowerCase();
            const interestMatch = interestValue === "" || interestValue.split(",").every(interest => userInterests.includes(interest.trim()));
    
            return roleMatch && skillMatch && interestMatch;
        });
    
        renderProfiles(filteredUsers);
    };

    const sendRequest = async (userId) => {
        if (!loggedInUserId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const token = localStorage.getItem('token'); // Replace 'authToken' with the correct key
    
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`, 
                },
            };
    
            const response = await axios.post(
                `http://localhost:3000/api/user/send-request`,
                { receiverId: userId },
                config
            );
    
            if (response.status === 200) {
                alert(`Request sent to user ID: ${userId}`);
            } else {
                alert("Failed to send request.");
            }
        } catch (error) {
            console.error("Error sending request:", error);
            alert(error.response.data.error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get("http://localhost:3000/api/user/all");
            if (response.status === 200) {
                const data = response.data;  
                renderProfiles(data.profiles);  

                applyFilters.addEventListener("click", () => filterUsers(data.profiles));
            } else {
                throw new Error('Failed to fetch users');
            }
        } catch (error) {
            console.error(error);
            profilesList.innerHTML = "<p>Failed to load user profiles.</p>";
        }
    };

    fetchUsers();
});
