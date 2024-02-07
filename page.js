function toggle_view(type) {
    if (type === "next_alarm") {
        let other_elem = document.getElementById("remaining_time");
        other_elem.style = "opacity: 0%";
        let current_elem = document.getElementById("next_alarm")
        current_elem.style = "top: 150px"
    } else if (type === "remaining_time") {
        let other_elem = document.getElementById("next_alarm");
        other_elem.style = "opacity: 0%";
        let current_elem = document.getElementById("remaining_time")
        current_elem.style = "bottom: 150px"
    }
}