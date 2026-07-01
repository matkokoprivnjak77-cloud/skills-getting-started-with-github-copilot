document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and previous options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantCount = details.participants.length;
        const participantsHtml = participantCount
          ? `<ul class="participants-list">${details.participants.map((participant) => `
              <li>
                <span class="participant-name">${participant}</span>
                <button type="button" class="participant-delete" data-activity="${name}" data-email="${participant}" aria-label="Remove ${participant}">&times;</button>
              </li>`).join("")}
            </ul>`
          : `<p class="no-participants">No participants yet — be the first to sign up.</p>`;

        activityCard.innerHTML = `
          <div class="activity-card-header">
            <h4>${name}</h4>
            <span class="activity-badge">${spotsLeft} spots left</span>
          </div>
          <p class="activity-description">${details.description}</p>
          <p class="activity-meta"><strong>Schedule:</strong> ${details.schedule}</p>
          <div class="participants-section">
            <div class="participants-section-header">
              <strong>Participants</strong>
              <span class="participant-count">${participantCount}/${details.max_participants}</span>
            </div>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        activityCard.querySelectorAll(".participant-delete").forEach((button) => {
          button.addEventListener("click", async () => {
            const activityName = button.dataset.activity;
            const participantEmail = button.dataset.email;

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (response.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || "Unable to remove participant";
                messageDiv.className = "error";
              }
            } catch (error) {
              messageDiv.textContent = "Failed to remove participant. Please try again.";
              messageDiv.className = "error";
              console.error("Error removing participant:", error);
            }

            messageDiv.classList.remove("hidden");
            setTimeout(() => {
              messageDiv.classList.add("hidden");
            }, 5000);
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
