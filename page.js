function toggle_view(type) {
    if (type === "next_alarm") {
        let other_elem = document.getElementById("remaining_time");
        other_elem.style = "max-height: 0px; opacity: 0%";
    } else if (type === "remaining_time") {
        let other_elem = document.getElementById("next_alarm");
        other_elem.style = "max-height: 0px; opacity: 0%";
    }
}