window.toggled = False;
function toggle_view(type) {
    if (type === "next_alarm") {
        var other_elem = document.getElementById("remaining_time");
    } else if (type === "remaining_time") {
        var other_elem = document.getElementById("next_alarm");
    } else return;
    
    if (window.toggled){
        other_elem.style = "";
    } else {
        other_elem.style = "max-height: 0px; opacity: 0%";
    }
    window.toggled = !window.toggled;
}