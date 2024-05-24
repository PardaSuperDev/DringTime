/**
 * Code source de la page des timers avant la sonnerie.
 * Ce code est volontairement non obfusqué et bien commenté pour qu'il
 * soit facilement comprehenssible pour des personnes (comme moi [Yannis])
 * qui aiment faire ctrl + maj + I ou F12.
 * Merci de ne pas m'insulter en me disant "Oh mais t'es nul ! Tu pouvais utiliser
 * cette fonction pour rendre la page plus rapide...". Je sais que certaines parties
 * du code ne sont pas les plus optimisées. Si vous avez des idées d'optimisation
 * et / ou d'amélioration ou même des bugs, vous pouvez faire une issue sur:
 * https://github.com/PardaSuperDev/DringTime.
 * 
 * Ce code est actuelement sous license MIT donc vous pouvez librement le réutiliser.
 * Bonne journée !
 * 
 * (Ce commentaire est quand même très long et un peu inutile mais bon... Il ne fait pas de mal)
 */

var sonneries = [
    // Liste de toutes les sonneries à mettre à jour en cas de changement
    // Format : hh:mm:ss
    // Chaque ligne représente un jour de la semaine
    // De dimanche à samedi
    [], [], [], [], [], [], []
];


window.toggled_view = false; // Utilisée pour connaitre l'état de la vue des timers
window.settings_opened = false; // Utlisée pour connaitre l'état d'ouverture des paramètres
window.alarmsProvider = "";
window.remoteProviderList = [];
window.localProviderList = [];
window.page = "timers_page";
window.textRenderingType = "ClearType";
window.currentTime = new Date();
window.lastTimeUpdate = 0;

var cursorLastMoveDelay = 0;
var lastTimeUpdateEpoch = (new Date()).getTime();

var user = null;

const connectionResultsDict = {
    "auth/invalid-email": "Email Invalide",
    "auth/missing-password": "Mot de passe non renseigné",
    "auth/invalid-credential": "Informations invalides",
    "auth/weak-password": "Le mot de passe doit faire au moins 6 charactères",
    "auth/email-already-in-use": "Email déjà utilisé",
};

function convertTimeToSeconds(time) {
    let hours = parseInt(time.substring(0, 2));
    let minutes = parseInt(time.substring(3, 5));
    let seconds = parseInt(time.substring(6, 8));

    return hours * 3600 + minutes * 60 + seconds;
}

async function updateAlarms() {
    if (window.alarmsProvider !== "") {
        let notSortedsonneries = undefined;
        if (window.alarmsProvider.substring(0, 2) === "r-") {
            notSortedsonneries = await window.getAlarmsList(window.alarmsProvider.substring(2));
        } else if (window.alarmsProvider.substring(0, 2) === "l-") {
            notSortedsonneries = getLocalAlarmsList(window.alarmsProvider.substring(2));
        }

        if (notSortedsonneries === undefined) return;

        for (let i = 0; i < notSortedsonneries.length; i++) {
            notSortedsonneries[i] = notSortedsonneries[i].sort(function (a, b) { return convertTimeToSeconds(a) - convertTimeToSeconds(b); });
        }

        sonneries = notSortedsonneries;
    };
}

function setup() {
    adjustCss();
    loadSettings();
    updateAlarms();
    secondsEnableInputToggled(document.getElementById("slider-seconds"));
    fullScreenEnableInputToggled(document.getElementById("slider-fullscreen"));
    load_settings_from_url();
    updateTimeFromServer();
    setupCursorMoveDetection();
}

function adjustCss() {
    // Si la plateforme n'est pas Windows, alors le système de rendu n'est pas ClearType et est donc en FreeType
    // On ajuste alors la font en coséquence
    if (!navigator.userAgent.toLowerCase().includes("win")) {
        var timerElem = document.getElementById("remaining_time_alarm");
        timerElem.style = "line-height: 0.85;";
        textRenderingType = "FreeType";
    }
}

function change_page(page) {
    if (page !== window.page) {
        var oldPage = document.getElementById(window.page);
        var newPage = document.getElementById(page);

    } else {
        return
    }
    oldPage.style = "opacity: 0;";
    newPage.style = "opacity: 0; position: absolute;"
    setTimeout(() => {
        oldPage.style = "display: none;";
        newPage.style = "opacity: 1; position: relative;"
    }, 500);

    if (window.settings_opened) toggle_settings_bar();
    window.page = page;
}

function timers_modified() {
    if (window.onbeforeunload === null) {
        window.onbeforeunload = function () { return 'Sure?'; };
    }
}

function setupCursorMoveDetection() {
    // Enregistre l'evenement de déplacement de la souris
    window.addEventListener("mousemove", () => {
        cursorLastMoveDelay = 0;
        document.body.style.cursor = "";
    })

    // Détecte toutes de 0.2 secondes si le delay avant de masquer est atteint
    setInterval(() => {
        if (cursorLastMoveDelay > 4 && document.body.style.cursor !== "none") {
            document.body.style.cursor = "none";
        }
        cursorLastMoveDelay += 0.2;
    }, 200)
}

async function updateTimeFromServer() {
    var requestData = await fetch('https://worldtimeapi.org/api/timezone/Europe/Paris', { mode: 'cors', method: 'GET', headers: { 'Content-Type': 'text/plain' } })
    var dataJson = await requestData.json();

    window.currentTime = new Date(dataJson["datetime"]);
}

function add_timers_row(day) {
    var inputColumns = document.getElementsByClassName("input_column");

    let newInput = document.createElement("input");
    newInput.type = "text";
    newInput.className = "timer_input stylized_button";
    newInput.name = "timer_input_0_" + 0;
    newInput.id = "timer_input_0_" + 0;
    newInput.setAttribute("onclick", "this.style=''");
    newInput.setAttribute("oninput", "timers_modified();")

    inputColumns[day].appendChild(newInput);

    // Fait réapparaitre le boutton "supprimer"
    var removeButtons = document.getElementsByClassName("remove_line_button");
    removeButtons[day].style = "";
    timers_modified();
}

function is_valid_num(value) {
    return /^\d+$/.test(value);
}

function concatenateNewAlarms() {
    var inputColumns = document.getElementsByClassName("input_column");


    var timersTableIsValid = true;

    var daysConcatenatedAlarms = [];

    for (var i = 0; i < inputColumns.length; i++) {
        let dayAlarms = [];
        let dayColumnChildren = inputColumns[i].children;
        for (var j = 0; j < dayColumnChildren.length; j++) {
            dayColumnChildren[j].style = "";
            let value = dayColumnChildren[j].value;

            // Teste la validité de l'entrée
            // Ne tentez pas de modifier la vérification pour la contourner car les données sont vérifiées dans le serveur
            if (value.length === 8 && value[2] === ":" && value[5] === ":" &&
                is_valid_num(value.substring(0, 2)) &&
                is_valid_num(value.substring(3, 5)) &&
                is_valid_num(value.substring(6, 8)) &&
                parseInt(value.substring(0, 2)) < 24 &&
                parseInt(value.substring(3, 5)) < 60 &&
                parseInt(value.substring(6, 8)) < 60
            ) {
                dayAlarms.push(value);
            } else {
                timersTableIsValid = false;
                dayColumnChildren[j].style = "background-color: #900;"
            }
        }
        daysConcatenatedAlarms.push(dayAlarms.join(";"));
    }

    return [timersTableIsValid, timersTableIsValid ? daysConcatenatedAlarms.join("-") : ""];
}

function save_new_timers() {
    var resultLabel = document.getElementById("new_timers_save_result_label");
    var timerNameInput = document.getElementById("new_timers_name_input");

    const concatenatedData = concatenateNewAlarms();

    console.log(concatenatedData);

    if (timerNameInput.value.length < 5 || timerNameInput.value > 24) {
        resultLabel.innerText = "La taille du nom doit être entre 5 et 24 !";
        resultLabel.style = "color: red;";
        return;
    }

    if (concatenatedData[0]) {
        const finalAlarmsData = concatenatedData[1];

        console.log("New Data : " + finalAlarmsData);

        const cookies = document.cookie.split("; ");

        var data = "";

        for (var i = 0; i < cookies.length; i++) {
            if (cookies[i].substring(0, 7) === "alarms=") {
                data = cookies[i].substring(7);
            }
        }

        if (data) {
            var found_existing = false;
            var decodedAlarmsData = atob(data);
            var alarms = decodedAlarmsData.split(",");
            for (var i = 0; i < alarms.length; i++) {
                var alarmData = alarms[i].split(">");
                if (alarmData[0] === timerNameInput.value) {
                    alarmData[1] = finalAlarmsData;
                    alarms[i] = alarmData[0] + ">" + alarmData[1]
                    found_existing = true;
                    break;
                }
            }

            console.log(found_existing);

            if (found_existing) {
                decodedAlarmsData = alarms.join(",");
            } else {
                decodedAlarmsData += "," + timerNameInput.value + ">" + finalAlarmsData;
            }
            document.cookie = "alarms=" + btoa(decodedAlarmsData) + "; path=/; max-age=126144000; SameSite=None; secure=false";
        } else {
            document.cookie = "alarms=" + btoa(timerNameInput.value + ">" + finalAlarmsData) + "; path=/; max-age=126144000; SameSite=None; secure=false";
        }

        resultLabel.innerText = "Sonneries sauvegardées !";
        resultLabel.style = "color: green;";
        window.onbeforeunload = null;
    } else {
        resultLabel.innerText = "Des horaires sont invalides !";
        resultLabel.style = "color: red;";
    }

    setTimeout(() => {
        resultLabel.innerText = "";
        resultLabel.style = "color: white;";
    }, 4000);

}

function manageAccountClicked() {
    if (window.user != null) {
        let mailTitle = document.getElementById("acount_manage_email_title");

        mailTitle.innerText = window.user.email;
        change_page("account_manage_page");
    } else {
        change_page("account_connection_page");
    }
}

function disconnectAccountClicked() {
    window.signOutAccount();
    user = null;
    change_page("timers_page");
}

async function createAccountClicked() {
    var emailInput = document.getElementById("account_create_email_input");
    var passwordInput = document.getElementById("account_create_password_input");
    var passwordConfirmInput = document.getElementById("account_confirm_password_input");

    var infoBox = document.getElementById("account_creation_info_label");

    if (passwordInput.value !== passwordConfirmInput.value) {
        infoBox.innerText = "Mots de passe non identiques";
        infoBox.style = "display: flex;";
        return;
    }

    infoBox.innerText = "Création du compte...";
    infoBox.style = "display: flex; background-color: rgb(213, 159, 0); outline-color: rgb(168, 126, 0);";

    const connectionResult = await window.createAccount(emailInput.value, passwordInput.value);

    console.log(connectionResult);

    if (connectionResult[0] == 1) {
        infoBox.innerText = connectionResult[1] in connectionResultsDict ? connectionResultsDict[connectionResult[1]] : connectionResult[1];
        infoBox.style = "display: flex;";
    } else {
        user = connectionResult[1];
        infoBox.innerText = "Connecté !";
        infoBox.style = "display: flex; background-color: rgb(0, 117, 25); outline-color: green;";
    }
}

async function connectAccountClicked() {
    var emailInput = document.getElementById("account_email_input");
    var passwordInput = document.getElementById("account_password_input");

    var infoBox = document.getElementById("connection_info_label");

    infoBox.innerText = "Connection...";
    infoBox.style = "display: flex; background-color: rgb(213, 159, 0); outline-color: rgb(168, 126, 0);";

    if (emailInput.value.toLowerCase() === "never gonna" && passwordInput.value.toLowerCase() === "give you up") {
        emailInput.value = "";
        passwordInput.value = "";
        window.location = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; 
        return; 
    }

    const connectionResult = await window.connectAccount(emailInput.value, passwordInput.value);

    console.log(connectionResult);

    if (connectionResult[0] == 1) {
        infoBox.innerText = connectionResult[1] in connectionResultsDict ? connectionResultsDict[connectionResult[1]] : connectionResult[1];
        infoBox.style = "display: flex;";
    } else {
        user = connectionResult[1];
        infoBox.innerText = "Connecté !";
        infoBox.style = "display: flex; background-color: rgb(0, 117, 25); outline-color: green;";
    }
}

async function publishAlarms() {
    var timerNameInput = document.getElementById("new_timers_name_input");
    var resultLabel = document.getElementById("new_timers_save_result_label");

    const concatenatedData = concatenateNewAlarms();

    if (timerNameInput.value.length < 5 || timerNameInput.value > 24) {
        resultLabel.innerText = "La taille du nom doit être entre 5 et 24 !";
        resultLabel.style = "color: red;";
        return;
    }

    if (concatenatedData[0]) {
        if (user === null) {
            console.warn("Merci de vous connecter dans les paramètres avant d'envoyer des sonneries.");
            resultLabel.innerText = "Merci de vous connecter dans les paramètres.";
            resultLabel.style = "color: red;";
        } else {
            try {
                await window.sendNewAlarms(timerNameInput.value, concatenatedData[1]);
                resultLabel.innerText = "Les sonneries ont bien été envoyées !";
                resultLabel.style = "color: green;";
                window.onbeforeunload = null;
            } catch (e) {
                console.warn("Impossible de publier les sonneries : " + e.message);
                resultLabel.innerText = "Ce nom de sonnerie semble déja utilisé.";
                resultLabel.style = "color: red;";
            }
        }
    } else {
        resultLabel.innerText = "Des horaires sont invalides !";
        resultLabel.style = "color: red;";
    }

    setTimeout(() => {
        resultLabel.innerText = "";
        resultLabel.style = "color: white;";
    }, 4000);
}

function remove_timers_row(day, removeButton) {
    var inputColumns = document.getElementsByClassName("input_column");

    if (inputColumns[day].children.length > 0) {
        var timersInputs = inputColumns[day].querySelectorAll(".timer_input");
        inputColumns[day].removeChild(timersInputs[timersInputs.length - 1]);
    }

    if (inputColumns[day].children.length === 0) removeButton.style = "display: none;";
    timers_modified();
}

function toggle_view(type) {
    /** Inverse le type de vue. `type` est l'id de la vue sur laquelle se concentrer.
     */

    // Si les paramètre sont ouverts, on les ferme
    if (window.settings_opened) toggle_settings_bar();

    // Réupère l'ID de l'élément à cacher
    if (type === "next_alarm") {
        var other_elem = document.getElementById("remaining_time");
    } else if (type === "remaining_time") {
        var other_elem = document.getElementById("next_alarm");
    } else return;

    // Récupère le logo des paramètres et change l'opacité en fonction du type de vue
    let settings_icon = document.getElementById("settings_icon_container");

    if (window.toggled_view) {
        other_elem.style = "";
        settings_icon.style = "opacity: 1";
        if (document.fullscreenElement) document.exitFullscreen();

    } else {
        other_elem.style = "max-height: 0px; opacity: 0";
        settings_icon.style = "opacity: 0";
        if (document.getElementById("slider-fullscreen").checked) document.documentElement.requestFullscreen();
    }
    window.toggled_view = !window.toggled_view;
}

function fullScreenEnableInputToggled(element) {
    askSave();
    if (!element.checked && document.fullscreenElement) {
        document.exitFullscreen();
    } else if (element.checked && window.toggled_view) {
        document.documentElement.requestFullscreen();
    }
}

function getLocalAlarmsList(providerName) {
    const cookies = document.cookie.split("; ");

    var data = "";
    for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].substring(0, 7) === "alarms=") {
            data = cookies[i].substring(7);
        }
    }
    var alarmsData = ""

    if (data) {
        var decodedAlarmsData = atob(data);
        var alarms = decodedAlarmsData.split(",");
        for (var i = 0; i < alarms.length; i++) {
            var alarmData = alarms[i].split(">");
            if (alarmData[0] === providerName) {
                alarmsData = alarmData[1];
                break;
            }
        }
    }

    if (alarmsData) {
        console.log(alarmsData);
        var days = alarmsData.split("-");
        var alarms = [];
        days.forEach((item) => {
            let dayAlarms = item.split(";");
            if (dayAlarms.lenght === 0 || dayAlarms[0] == "") {
                alarms.push([]);
            } else alarms.push(dayAlarms[dayAlarms.lenght - 1] === "" ? dayAlarms.slice(0, dayAlarms.lenght - 1) : dayAlarms);
        })
        return alarms;
    }
    return [[], [], [], [], [], [], []];
}

function getLocalProviders() {
    let providers = [];
    const cookies = document.cookie.split("; ");

    var data = "";

    for (var i = 0; i < cookies.length; i++) {
        if (cookies[i].substring(0, 7) === "alarms=") {
            data = cookies[i].substring(7);
        }
    }

    if (data) {
        var decodedAlarmsData = atob(data);
        var alarms = decodedAlarmsData.split(",");
        for (var i = 0; i < alarms.length; i++) {
            var alarmData = alarms[i].split(">");
            providers.push(alarmData[0]);

        }
    }

    return providers;
}

async function updateProviders() {
    let remoteProviders = await window.getAlarmsProviders();
    let localProviders = getLocalProviders();

    window.remoteProviderList = remoteProviders;
    window.localProviderList = localProviders;

    let providersCombo = document.getElementById("alarm_providers_combo");

    localProviders.forEach(provider => {
        var option = document.createElement('option');
        option.value = "l-" + provider;
        option.innerText = "L: " + provider;

        providersCombo.appendChild(option);
    });

    remoteProviders.forEach(provider => {
        var option = document.createElement('option');
        option.value = "r-" + provider;
        option.innerText = "R: " + provider;

        providersCombo.appendChild(option);
    });
}

async function updateProvidersCombo() {
    let alarmProvidersCombo = document.getElementById("alarm_providers_combo");
    await updateProviders();
    alarmProvidersCombo.value = window.alarmsProvider;
}

function toggle_settings_bar() {
    let settingsBar = document.getElementById("settings_bar");
    let settingsIcon = document.getElementById("settings_icon_container");
    if (window.settings_opened) {
        settingsBar.style = "width: 0px";
        if (window.toggled_view) {
            settingsIcon.style = "opacity: 0"
        } else {
            settingsIcon.style = "opacity: 1"
        }
    } else {
        settingsBar.style = "width: var(--max-settings-bar-lenght)";
        settingsIcon.style = "opacity: 1"
        if (window.remoteProviderList.length === 0 && window.localProviderList.length === 0) updateProvidersCombo();
    }

    window.settings_opened = !window.settings_opened;
}

function askSave() {
    // Met à jour l'icon d'enregistrement
    let saveIconElement = document.getElementById("save_icon");
    let savedIconElement = document.getElementById("saved_icon");
    saveIconElement.hidden = false;
    savedIconElement.hidden = true;

    let clipboardSaveIconElement = document.getElementById("clipboard_save_icon");
    let clipboarsdSavedIconElement = document.getElementById("clipboard_saved_icon");
    clipboardSaveIconElement.hidden = false;
    clipboarsdSavedIconElement.hidden = true;
}

function changeProvider(element) {
    let itemindex = element.selectedIndex
    let providerValue = element.options[itemindex].value;
    if (providerValue.toLowerCase() === "rick") { window.location = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; return; }
    window.alarmsProvider = providerValue;
    updateAlarms();
    askSave();
}

function secondsEnableInputToggled(elem) {
    askSave();
    let secondsPart = document.getElementsByClassName("seconds_timer_part");
    if (elem.checked) {
        for (let i = 0; i < secondsPart.length; i++) {
            secondsPart[i].style = "opacity: 1; max-width: 180px;";
        }
    } else {
        for (let i = 0; i < secondsPart.length; i++) {
            secondsPart[i].style = "opacity: 0; max-width: 0px;";
        }
    }
}

async function update() {
    /** Fonction appelée de manière régulière pour mettre à jour les timers.*/
    var currentTime = (new Date()).getTime();

    var deltaTime = (currentTime-lastTimeUpdateEpoch)/1000;

    lastTimeUpdateEpoch = currentTime;

    window.currentTime.setMilliseconds(window.currentTime.getMilliseconds() + deltaTime * 1000);
    window.lastTimeUpdate += deltaTime;

    if (window.lastTimeUpdate > 3600) {
        updateTimeFromServer();
        window.lastTimeUpdate = 0;
    }

    // On récupère les éléments timer
    let remainingTimeElement = document.getElementById("remaining_time_alarm");
    let nextAlarmElement = document.getElementById("next_alarm_timer");
    let timerContainerElement = document.getElementById("timers_elements_container");
    let noAlarmElement = document.getElementById("no_alarm");
    let noAlarmProviderElement = document.getElementById("no_alarm_provider");

    // Récupère les autres éléments
    let showSecondsSlider = document.getElementById("slider-seconds");

    // Récupère le jour et l'heure actuelle
    let date = window.currentTime;
    let day = date.getDay();

    // Récupère les sonneries de la journée actuelle
    let todayAlarms = sonneries[day];

    // Récupère la prochaine sonnerie
    const currentTimeStr = date.toLocaleTimeString('en-US', { hour12: false });
    const nextAlarm = todayAlarms.filter(time => time > currentTimeStr)[0];

    // Si aucune alarme n'est prevue, on quitte la fonction et on met un message d'erreur
    if (window.alarmsProvider === "" || window.alarmsProvider === undefined) {
        timerContainerElement.style = "display: none";
        noAlarmProviderElement.style = "";
        noAlarmElement.style = "display: none";
        return;
    } else if (nextAlarm === undefined) {
        timerContainerElement.style = "display: none";
        noAlarmProviderElement.style = "display: none";
        noAlarmElement.style = "";
        return;
    } else {
        timerContainerElement.style = "";
        noAlarmProviderElement.style = "display: none";
        noAlarmElement.style = "display: none";
    }

    // Récupère l'heure de la procaine sonnerie en int
    let nextAlarmHourInt = parseInt(nextAlarm.substring(0, 2));
    let nextAlarmMinuteInt = parseInt(nextAlarm.substring(3, 5));
    let nextAlarmSecondsInt = parseInt(nextAlarm.substring(6, 8));

    // Calcule le temps écoulé entre minuit et maintenant
    // Et entre minuit et la prochaine sonnerie
    let totalCurrentDaySeconds = date.getSeconds() + date.getMinutes() * 60 + date.getHours() * 3600
    let totalNextAlarmDaySeconds = nextAlarmHourInt * 3600 + nextAlarmMinuteInt * 60 + nextAlarmSecondsInt


    // Calcule les valeurs des timers
    // Récupère le temps en seconde avant 
    // la prochaie sonnerie et le convertit en heure, minutes et secondes
    let totalRemainingSeconds = totalNextAlarmDaySeconds - totalCurrentDaySeconds;
    let remainingHour = Math.floor(totalRemainingSeconds / 3600);
    let remainingMinutes = Math.floor(totalRemainingSeconds / 60) - remainingHour * 60;
    let remainingSeconds = Math.floor(totalRemainingSeconds) - remainingMinutes * 60 - remainingHour * 3600;

    // Récupère les paramètres
    let showSeconds = showSecondsSlider.checked;

    // Crée les valeurs des timers
    var newTimerValue = "";

    if (remainingHour === 0) {
        newTimerValue = ("00" + remainingMinutes).slice(-2) + ":" + ("00" + remainingSeconds).slice(-2);
    } else {
        newTimerValue = ("00" + remainingHour).slice(-2) + ":" + ("00" + remainingMinutes).slice(-2) + (true ? (":" + ("00" + remainingSeconds).slice(-2)) : "");
    }

    // Met à jour les timers
    let spansDigits = remainingTimeElement.querySelector("#default_timer_digits").getElementsByClassName("timer_digits");
    let scrollingSpansDigits = remainingTimeElement.querySelector("#visual_scroller_digits").getElementsByClassName("timer_digits");

    let spans = Array.from(spansDigits[0].getElementsByTagName("span")).concat(Array.from(spansDigits[1].getElementsByTagName("span")));
    let scrollingSpans = Array.from(scrollingSpansDigits[0].getElementsByTagName("span")).concat(Array.from(scrollingSpansDigits[1].getElementsByTagName("span")));

    for (let i = 0; i < spans.length; i++) {
        let spanElem = spans[i];
        let scrollingSpanElem = scrollingSpans[i];
        if (spanElem.innerText != newTimerValue[i]) {
            spanElem.style = "transition: none !important";
            scrollingSpanElem.style = "transition: none !important";

            const transformString = textRenderingType == "ClearType" ? "translateY(-70px)" : "translateY(-85px)"

            spanElem.style.transform = transformString;
            scrollingSpanElem.style.transform = transformString;
            setTimeout(function () { spanElem.style = ""; scrollingSpanElem.style = "" }, 500);
            spanElem.innerText = newTimerValue[i] === undefined ? "" : newTimerValue[i];

            let digitValue = ":";
            if (newTimerValue[i] !== ":") {
                if (newTimerValue[i - 1] === ":") {
                    digitValue = (parseInt(newTimerValue[i]) + 1) % 6;
                } else {
                    digitValue = (parseInt(newTimerValue[i]) + 1) % 10;
                }
            }
            scrollingSpanElem.innerText = newTimerValue[i] === undefined ? "" : digitValue;
        };
    }
    nextAlarmElement.innerText = nextAlarm.substring(0, 5);

}

function setColor(elems) {
    if (elems === "labels") {
        document.getElementById("choose_labels_color").click();
    } else if (elems === "background") {
        document.getElementById("choose_background_color").click();
    }
}

function saveSettings() {

    // Récupère les éléments couleur
    let labelColorElement = document.getElementById("choose_labels_color");
    let backgroundColorElement = document.getElementById("choose_background_color");

    // Met à jour l'icon d'enregistrement
    let saveIconElement = document.getElementById("save_icon");
    let savedIconElement = document.getElementById("saved_icon");
    saveIconElement.hidden = true;
    savedIconElement.hidden = false;

    // Récupère les autres éléments
    let sliderFullscreen = document.getElementById("slider-fullscreen");
    let sliderShowSeconds = document.getElementById("slider-seconds");

    // Crée l'objet de paramètres
    let settingsObject = {
        "label_color": labelColorElement.value,
        "background_color": backgroundColorElement.value,
        "alarms_provider": window.alarmsProvider,
        "enable_fullscreen": sliderFullscreen.checked,
        "enable_seconds": sliderShowSeconds.checked
    }


    // Encode les paramètres
    let settingsObjectStringified = JSON.stringify(settingsObject);
    let settingB64Encoded = btoa(settingsObjectStringified);

    // Met à jour le cookie de paramètres
    document.cookie = "settings=" + settingB64Encoded + "; path=/; max-age=126144000; SameSite=None; secure=false";
}

function saveSettingsToClipboard() {
    // Met à jour l'icon d'enregistrement
    let saveIconElement = document.getElementById("clipboard_save_icon");
    let savedIconElement = document.getElementById("clipboard_saved_icon");
    saveIconElement.hidden = true;
    savedIconElement.hidden = false;

    // Crée l'url et la copie dans le presse papier

    // Récupère les éléments couleur
    let labelColorElement = document.getElementById("choose_labels_color");
    let backgroundColorElement = document.getElementById("choose_background_color");

    // Récupère les autres éléments
    let sliderFullscreen = document.getElementById("slider-fullscreen");
    let sliderShowSeconds = document.getElementById("slider-seconds");

    var elements = [
        "label_color=" + labelColorElement.value,
        "background_color=" + backgroundColorElement.value,
        "alarms_provider=" + window.alarmsProvider,
        "enable_fullscreen=" + sliderFullscreen.checked,
        "enable_seconds=" + sliderShowSeconds.checked
    ];

    var urlElements = "https://dring-time.fr/?" + elements.join("&");

    navigator.clipboard.writeText(urlElements);
    console.log("URL value : " + urlElements);
}

function load_settings_from_url() {
    // Récupère l'url et la découpe
    const url = window.location.href.split("/");
    var settings = url[url.length - 1]

    if (settings.includes("?")) {
        settings = "?" + settings.split("?")[1]
    }


    // Si l'url contient des paramètre, on l'analyse
    if (settings.startsWith("?")) {
        settings = settings.substring(1);

        //Récupère les éléments à modifier
        let labelColorElement = document.getElementById("choose_labels_color");
        let backgroundColorElement = document.getElementById("choose_background_color");
        let sliderFullscreen = document.getElementById("slider-fullscreen");
        let sliderShowSeconds = document.getElementById("slider-seconds");

        // Définit une variable pour savoir si on doit demander à l'utilisateur de sauvegarder les paramètres
        var needSave = false;

        // Itère dans les paramètres pour les mettre à jour
        const settingsParts = settings.split("&");
        for (let i = 0; i < settingsParts.length; i++) {
            const settingsPair = settingsParts[i].split("=");
            const settingsName = settingsPair[0];
            const settingsValue = settingsPair[1];
            switch (settingsName) {
                case ("label_color"):
                    var reg = /^#([0-9a-f]{3}){1,2}$/i
                    if (reg.test(settingsValue)) {
                        labelColorElement.value = settingsValue;
                        document.documentElement.style.setProperty('--text-color', settingsValue);
                        document.querySelector('#choose_labels_color').dispatchEvent(new Event('input', { bubbles: true }));
                        needSave = true;
                    } else console.warn("Valeur invalide pour la paramètre \"" + settingsName + "\": " + settingsValue + ".");
                    break;
                case ("background_color"):
                    var reg = /^#([0-9a-f]{3}){1,2}$/i
                    if (reg.test(settingsValue)) {
                        backgroundColorElement.value = settingsValue;
                        document.documentElement.style.setProperty('--background-color', settingsValue);
                        document.querySelector('#choose_background_color').dispatchEvent(new Event('input', { bubbles: true }));
                        needSave = true;
                    } else console.warn("Valeur invalide pour la paramètre \"" + settingsName + "\": " + settingsValue + ".");
                    break;
                case ("alarms_provider"):
                    if (settingsValue.startsWith("r-") || settingsValue.startsWith("l-")) {
                        window.alarmsProvider = settingsValue;
                        needSave = true;
                        updateAlarms();
                    } else console.warn("Valeur invalide pour la paramètre \"" + settingsName + "\": " + settingsValue + ".");
                    break;
                case ("enable_fullscreen"):
                    if (settingsValue == "true" || settingsValue == "false") {
                        sliderFullscreen.checked = settingsValue == "true";
                        fullScreenEnableInputToggled(sliderFullscreen);
                        needSave = true;
                    } else console.warn("Valeur invalide pour la paramètre \"" + settingsName + "\": " + settingsValue + ".");
                    break;
                case ("enable_seconds"):
                    if (settingsValue == "true" || settingsValue == "false") {
                        sliderShowSeconds.checked = settingsValue == "true";
                        secondsEnableInputToggled(sliderShowSeconds);
                        needSave = true;
                    } else console.warn("Valeur invalide pour la paramètre \"" + settingsName + "\": " + settingsValue + ".");
                    break;
                default:
                    console.warn("Paramètre inconnu : \"" + settingsName + "\".");
                    break;
            }

            // On fait la demande pour sauvegarder
            if (needSave) askSave();
        }
    }
}

async function loadSettings() {

    // Récupère les cookies
    let cookies = document.cookie.split("; ");

    // Scanne tous les cookies
    for (let i = 0; i < cookies.length; i++) {
        // Vérifie que le cookie est bien un cookie des paramètres 
        if (cookies[i].substring(0, 9) === "settings=") {
            // Désencode le cookie
            let b64EncodedSettings = cookies[i].substring(9);
            let settingsObjectStringified = atob(b64EncodedSettings);
            let settingsObject = JSON.parse(settingsObjectStringified);

            //Récupère les éléments à modifier
            let labelColorElement = document.getElementById("choose_labels_color");
            let backgroundColorElement = document.getElementById("choose_background_color");
            let sliderFullscreen = document.getElementById("slider-fullscreen");
            let sliderShowSeconds = document.getElementById("slider-seconds");

            // Met à jour les autres paramètres
            window.alarmsProvider = settingsObject["alarms_provider"];

            // Modifie les valers des éléments
            labelColorElement.value = settingsObject["label_color"];
            backgroundColorElement.value = settingsObject["background_color"];
            sliderFullscreen.checked = settingsObject["enable_fullscreen"];
            sliderShowSeconds.checked = settingsObject["enable_seconds"];
            secondsEnableInputToggled(sliderShowSeconds);
            fullScreenEnableInputToggled(sliderFullscreen);

            // Met à jour le CSS
            document.documentElement.style.setProperty('--text-color', settingsObject["label_color"]);
            document.documentElement.style.setProperty('--background-color', settingsObject["background_color"]);

            // Met à jour les couleurs des sélécteurs
            document.querySelector('#choose_labels_color').dispatchEvent(new Event('input', { bubbles: true }));
            document.querySelector('#choose_background_color').dispatchEvent(new Event('input', { bubbles: true }));

            break;
        }
    }
}

// Paramètre les éléments Coloris
Coloris({
    themeMode: 'dark',
    alpha: false,
    margin: 30,
    defaultColor: "#FFFFFF",
    onChange: (color, input) => {
        if (input.id === "choose_labels_color") document.documentElement.style.setProperty('--text-color', color);
        else if (input.id === "choose_background_color") document.documentElement.style.setProperty('--background-color', color);

        askSave();
    }
});

// Lance l'execution régulière de `update()`. 
// Le timeout est de 200 ms pour éviter la désincronisation et avoir une grande précision des secondes.
setInterval(() => { update() }, 200);
