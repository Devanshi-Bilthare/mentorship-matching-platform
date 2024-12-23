document.addEventListener("DOMContentLoaded", () => {
    const skillInput = document.getElementById("skillInput");
    const skillsTags = document.getElementById("skillsTags");
    const skillsHiddenInput = document.getElementById("skillsHiddenInput");

    const interestInput = document.getElementById("interestInput");
    const interestsTags = document.getElementById("interestsTags");
    const interestsHiddenInput = document.getElementById("interestsHiddenInput");

    const profileForm = document.getElementById("profileForm");

    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to access this page.");
        window.location.href = "index.html";
        return;
    }

    const axiosInstance = axios.create({
        baseURL: "http://localhost:3000/api/user",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
    });

    const updateHiddenInput = (container, hiddenInput) => {
        const tags = Array.from(container.querySelectorAll(".tag"))
            .map(tag => tag.textContent.replace("✖", "").trim());
        hiddenInput.value = tags.join(", ");
    };

    const createTag = (text, container, hiddenInput) => {
        const existingTags = Array.from(container.querySelectorAll(".tag"))
            .map(tag => tag.textContent.replace("✖", "").trim());
        if (existingTags.includes(text)) {
            return; 
        }

        const tag = document.createElement("span");
        tag.classList.add("tag");
        tag.textContent = text;

        const removeBtn = document.createElement("span");
        removeBtn.textContent = "✖";
        removeBtn.classList.add("remove");
        removeBtn.onclick = () => {
            tag.remove();
            updateHiddenInput(container, hiddenInput);
        };

        tag.appendChild(removeBtn);
        container.appendChild(tag);

        updateHiddenInput(container, hiddenInput);
    };

    const handleInput = (input, container, hiddenInput) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && input.value.trim() !== "") {
                e.preventDefault();
                createTag(input.value.trim(), container, hiddenInput);
                input.value = "";
            }
        });
    };

    handleInput(skillInput, skillsTags, skillsHiddenInput);
    handleInput(interestInput, interestsTags, interestsHiddenInput);

    const fetchProfile = async () => {
        try {
            const response = await axiosInstance.get("/profile");
            const { user } = response.data;

            document.getElementById("name").value = user.name || "";
            document.getElementById("email").value = user.email || "";
            document.getElementById("role").value = user.role || "";
            document.getElementById("bio").value = user.bio || "";

            if (user.skills) {
                user.skills.forEach(skill => createTag(skill, skillsTags, skillsHiddenInput));
            }

            if (user.interests) {
                user.interests.forEach(interest => createTag(interest, interestsTags, interestsHiddenInput));
            }
        } catch (error) {
            alert("Failed to fetch profile data. Please try again.");
            console.error(error);
        }
    };

    fetchProfile();

    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const role = document.getElementById("role").value;
        const bio = document.getElementById("bio").value;
        const skills = skillsHiddenInput.value.split(", ").filter(Boolean);
        const interests = interestsHiddenInput.value.split(", ").filter(Boolean);

        const updatedData = { name, email, role, bio, skills, interests };

        try {
            await axiosInstance.put("/edit", updatedData);
            alert("Profile updated successfully!");
            fetchProfile(); 
        } catch (error) {
            alert("Failed to update profile. Please try again.");
            console.error(error);
        }
    });

    const tabs = document.querySelectorAll(".tab");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            tabs.forEach((t) => t.classList.remove("active"));
            tabContents.forEach((content) => content.classList.add("hidden"));

            tab.classList.add("active");
            const tabId = tab.getAttribute("data-tab");
            document.getElementById(tabId).classList.remove("hidden");
        });
    });

    const handleRequest = async (id, action) => {
        const token = localStorage.getItem("token");

        if (!token) {
            alert("You must be logged in to perform this action.");
            return;
        }

        try {
            const response = await axiosInstance.post(`/request/${action}`, {
                token,
                senderId: id
            });
            if (response.status === 200) {
                alert(`${action.charAt(0).toUpperCase() + action.slice(1)} request sent successfully!`);
                fetchData(); 
            }
        } catch (error) {
            alert(`Failed to ${action} request. Please try again.`);
            console.error(error);
        }
    };

    const fetchData = async () => {
        try {
            const receivedRequestsResponse = await axiosInstance.get("/received-requests");
            const receivedRequests = receivedRequestsResponse.data.receivedRequests;
            const receivedRequestsList = document.getElementById("receivedRequestsList");
            receivedRequestsList.innerHTML = "";
            receivedRequests?.forEach(request => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <div>
                        <p><strong>Name:</strong>${request.name}</p>
                        <p><strong>Role:</strong> ${request.role || 'NA'}</p>
                        <p><strong>Bio:</strong>${request.bio || "NA"}</p>
                        <p><strong>Skills:</strong> ${request.skills || "NA"}</p>
                        <p><strong>Interests:</strong> ${request.interests || 'NA'}</p>
                    </div>
                `;
    
                const buttonsDiv = document.createElement("div");
                buttonsDiv.classList.add("button-container");
    
                const acceptBtn = document.createElement("button");
                acceptBtn.textContent = "Accept";
                acceptBtn.classList.add("accept");
                acceptBtn.addEventListener("click", () => handleRequest(request.id, "accept"));
    
                const rejectBtn = document.createElement("button");
                rejectBtn.textContent = "Reject";
                rejectBtn.classList.add("reject");
                rejectBtn.addEventListener("click", () => handleRequest(request.id, "reject"));
    
                buttonsDiv.appendChild(acceptBtn);
                buttonsDiv.appendChild(rejectBtn);
                li.appendChild(buttonsDiv);
                receivedRequestsList.appendChild(li);
            });
    
            const sentRequestsResponse = await axiosInstance.get("/sent-requests");
            const sentRequests = sentRequestsResponse.data.sentRequests;
            const sentRequestsList = document.getElementById("sentRequestsList");
            sentRequestsList.innerHTML = "";
            sentRequests?.forEach(request => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <div>
                        <p><strong>Name: </strong>${request.name}</p>
                        <p><strong>Role:</strong> ${request.role || 'NA'}</p>
                        <p><strong>Bio: </strong>${request.bio || 'NA'}</p>
                        <p><strong>Skills: </strong> ${request?.skills || 'NA'}</p>
                        <p><strong>Interests: </strong> ${request?.interests || 'NA'}</p>
                    </div>
                `;
                sentRequestsList.appendChild(li);
            });
    
            const connectionsResponse = await axiosInstance.get("/all-connections");
            const connections = connectionsResponse.data.connections;
            const connectionsList = document.getElementById("connectionsList");
            connectionsList.innerHTML = "";
            connections?.forEach(connection => {
                const li = document.createElement("li");
                li.innerHTML = `
                    <div>
                        <p><strong>Name:</strong>${connection.name || 'NA'}</p>
                        <p><strong>Role:</strong> ${connection.role || 'NA'}</p>
                        <p><strong>Bio:</strong>${connection.bio || 'NA'}</p>
                        <p><strong>Skills:</strong> ${connection.skills || "NA"}</p>
                        <p><strong>Interests:</strong> ${connection.interests || "NA"}</p>
                    </div>
                `;
    
                connectionsList.appendChild(li);
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };
    

    fetchData();
});
