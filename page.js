window.toggled = False;
function toggle_view(type) {
    if (type === "next_alarm") {
        var other_elem = document.getElementById("remaining_time");
    } else if (type === "remaining_time") {
        var other_elem = document.getElementById("next_alarm");
    } else return;

    let settings_icon = document.getElementById("parameter_icon_container");
    
    if (window.toggled){
        other_elem.style = "";
        settings_icon.style = "opacity: 100%";
    } else {
        other_elem.style = "max-height: 0px; opacity: 0%";
        settings_icon.style = "opacity: 0%;";
    }
    window.toggled = !window.toggled;
}