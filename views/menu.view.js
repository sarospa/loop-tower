Views.registerView("menu", {
    selector: "#menu",
    html() {
        let html = "";
        html += Views.menu.htmlChangelog();
        html += Views.menu.htmlSaveMenu();
        html += Views.menu.htmlFAQMenu();
        html += Views.menu.htmlOptionsMenu();
        html += Views.menu.htmlExtrasMenu();
        html += Views.menu.htmlChallengeMenu();
        html += Views.menu.htmlTotalsMenu();
        html += Views.menu.htmlPrestigeMenu();
        return html;
    },
    versions() {
        let html = "";
        const versions = _txtsObj("menu>changelog>version");
        $(versions).each((_index, version) => {
            html += `<div class='showthat2'>
                        ${`${_txt("menu>changelog>meta>version_prefix")} ${$(version).attr("verNum")}`}
                        <div class='showthis2'>
                            ${$(version).text()}
                        </div>
                    </div>
                    `;
        });
        return html;
    },
    htmlChangelog() {
        const html =
        `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>changelog>meta>title")}
            <div style='max-width:110px;' class='showthisH' id='changelog'>
                ${this.versions()}
            </div>
        </li>`;
        return html;
    },
    htmlSaveMenu() {
        const html =
        `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>save>meta>title")}
            <div class='showthisH'>
                <button class='button' onclick='save()'>${_txt("menu>save>manual_save")}</button>
                <br>
                <textarea id='exportImportList'></textarea><label for='exportImportList'> ${_txt("menu>save>list_label")}</label>
                <br>
                <button class='button' style='margin-right: 2px;' onclick='exportCurrentList()'>${_txt("menu>save>export_button")}</button>
                <button class='button' onclick='importCurrentList()'>${_txt("menu>save>import_button")}</button>
                <br>
                ${_txt("menu>save>list_comment")}
                <br><br>
                <input id='exportImport'><label for='exportImport'> ${_txt("menu>save>input_label")}</label><br>
                <button class='button' style='margin-top: 5px; margin-right: 2px;' onclick='exportSave()'>${_txt("menu>save>export_button")}</button>
                <button class='button' style='margin-top: 1px;' onclick='importSave()'>${_txt("menu>save>import_button")}</button><br>
                ${_txt("menu>save>export_comment")}<br>
                ${_txt("menu>save>import_comment")}<br>
                <button class='button' style='margin-top: 5px; margin-right: 2px;' onclick='exportSaveFile()'>${_txt("menu>save>exportfile_button")}</button>
                <button class='button' style='margin-top: 1px;' onclick='openSaveFile()'>${_txt("menu>save>importfile_button")}</button>
                <input id="SaveFileInput" type='file' style="visibility:hidden;" onchange="importSaveFile(event)" />
                <br>
                <div id="cloud_save" class="block" style="display:none">
                    ${_txt("menu>save>cloud_label")}<br>
                    <button class='button' style='margin-top: 5px; margin-right: 2px;' onclick='googleCloud.exportSave()'>${_txt("menu>save>exportcloud_button")}</button>
                    <button class='button' style='margin-top: 1px;' onclick='googleCloud.loadSaves(true)'>${_txt("menu>save>importcloud_button")}</button>
                    <ul id='cloud_save_result'></ul>
                </div>
            </div>
        </li>`;
        return html;
    },
    FAQs() {
        let html = "";
        const QAs = _txtsObj("menu>faq>q_a");
        $(QAs).each((_index, QA) => {
            html += 
            `${_txt("menu>faq>meta>q_prefix")} <i>"${$(QA).find("q").html()}"</i><br>
            ${_txt("menu>faq>meta>a_prefix")} ${$(QA).find("a").html()}<br>
            <br>`;
        });
        return html;
    },
    htmlFAQMenu() {
        const html = 
        `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>faq>meta>title")}
            <div class='showthisH'>
                ${this.FAQs()}
            </div>
        </li>`;
        return html;
    },
    htmlOptionsMenu() {
        const html =
            `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>options>meta>title")}
            <div class='showthisH'>
                <a target='_blank' href='${_txt("menu>options>discord>link")}'>${_txt("menu>options>discord>title")}</a><br>
                ${Views.menu.htmlThemeMenu()}
                ${Object.keys(Localization.supportedLang).length > 1 ? Views.menu.htmlLocalizationMenu() : ""}
                ${_txt("menu>options>adblock_warning")}<br>
                <input id='responsiveUIInput' type='checkbox' onchange='setOption("responsiveUI", this.checked)'/>
                    <label for='responsiveUIInput'>${_txt("menu>options>responsive_ui")}</label>
                <br>
                <input id='actionLogInput' type='checkbox' onchange='setOption("actionLog", this.checked)'/>
                    <label for='actionLogInput'>${_txt("menu>options>action_log")}</label>
                <br>
                <input id='googleCloudInput' type='checkbox' onchange='setOption("googleCloud", this.checked)'/>
                    <label for='googleCloudInput'>${_txt("menu>options>google_cloud")}</label>
                <br>
                <input id='highlightNewInput' type='checkbox' onchange='setOption("highlightNew", this.checked)'/>
                    <label for='highlightNewInput'>${_txt("menu>options>highlight_new")}</label>
                <br>
                <input id='statColorsInput' type='checkbox' onchange='setOption("statColors", this.checked)'/>
                    <label for='statColorsInput'>${_txt("menu>options>stat_colors")}</label>
                <br>
                <input id='statHintsInput' type='checkbox' onchange='setOption("statHints", this.checked)'/>
                    <label for='statHintsInput'>${_txt("menu>options>stat_hints")}</label>
                <br>
                <input id='pingOnPauseInput' type='checkbox' onchange='setOption("pingOnPause", this.checked)'/>
                    <label for='pingOnPauseInput'>${_txt("menu>options>pause_audio_cue")}</label>
                <br>
                <input id='notifyOnPauseInput' type='checkbox' onchange='setOption("notifyOnPause", this.checked)'/>
                    <label for='notifyOnPauseInput'>${_txt("menu>options>pause_notify_cue")}</label>
                <br>
                <input id='autoMaxTrainingInput' type='checkbox' onchange='setOption("autoMaxTraining", this.checked)'/>
                    <label for='autoMaxTrainingInput'>${_txt("menu>options>auto_max_training")}</label>
                <br>
                <input id='hotkeysInput' type='checkbox' onchange='setOption("hotkeys", this.checked)'/>
                    <label class='showthat' for='hotkeysInput'>${_txt("menu>options>hotkeys")}
                    <div class='showthis'>${_txt("menu>options>hotkeys_tooltip")}</div>
                </label>
                <br>
                ${_txt("menu>options>update_rate")}
                <input id='updateRateInput' type='number' value='50' min='1' style='width: 50px;transform: translateY(-2px);' oninput='setOption("updateRate", parseInt(this.value))' />
                <br>
                ${_txt("menu>options>autosave_rate")}
                <input id='autosaveRateInput' type='number' value='30' min='1' style='width: 50px;transform: translateY(-2px);' oninput='setOption("autosaveRate", parseInt(this.value))' />
                <br>
            </div>
        </li>`;
        return html;
    },
    htmlLocalizationMenu() {
        const lg = Localization.supportedLang;
        let html = `${_txt("menu>options>localization_title")}: <select id='localization_menu' onchange='Localization.change();'>`;
        $.each(lg, (val, str) => {
            html += `<option value='${val}'${Localization.currentLang === val ? "selected" : ""}>${str}</option>`;
        });
        html += "</select><br>";
        return html;
    },
    htmlThemeMenu() {
        const themeList = ["normal", "dark", "cubic", "cubic t-dark"];
        const themes = _txtsObj("menu>options>theme");
        let html = `${_txt("menu>options>theme_title")}: <select id='themeInput' onchange='view.changeTheme();'>`;
        $(themes).each((index, theme) => {
            html += `<option value='${themeList[index]}'>${$(theme).find(themeList[index].replaceAll(" ","_")).text()}</option>`;
        });
        html += "</select><br>";
        html += `<div class='block' id='themeVariantSection'>${_txt("menu>options>theme_variant_title")}: <select id='themeVariantInput' onchange='view.changeTheme();'>`;
        $(themes).each((index, theme) => {
            $(theme).find("variants>*").each((vindex, variant) => {
                html += `<option class='variant-${themeList[index].replaceAll(" ","_")}' value='${variant.tagName}'>${$(variant).text()}</option>`;
            });
        });
        html += "</select></div>"
        return html;
    },
    htmlExtrasMenu() {
        const html =
            `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>options>meta>extras")}
            <div class='showthisH' style='padding-top:1ex'>
                ${_txt("menu>options>extras_warning")}<br>
                <br>
                <input id='fractionalManaInput' type='checkbox' onchange='setOption("fractionalMana", this.checked)'/>
                    <label for='fractionalManaInput'>${_txt("menu>options>fractional_mana")}</label>
                <br>
                <input id='predictorInput' type='checkbox' onchange='setOption("predictor", this.checked)'/>
                    <label for='predictorInput'>${_txt("menu>options>predictor")}</label>
                <br>
                <div class='control'>
                    <input type='checkbox' id='speedIncrease10xInput' onchange='setOption("speedIncrease10x", this.checked)'>
                    <label for='speedIncrease10xInput'>${_txt("menu>options>speedIncrease10x_text")}</label>
                </div>
                <br>
                <div class='control'>
                    <input type='checkbox' id='speedIncrease20xInput' onchange='setOption("speedIncrease20x", this.checked)'>
                    <label for='speedIncrease20xInput'>${_txt("menu>options>speedIncrease20x_text")}</label>
                </div>
                <br>
                ${_txt("menu>options>speedIncreaseCustom_text")}
                <input id='speedIncreaseCustomInput' type='number' value='5' min='1' style='width: 50px;transform: translateY(-2px);' oninput='setOption("speedIncreaseCustom", parseInt(this.value))' />
                <br>
                ${_txt("menu>options>speedIncreaseBackground_text")}
                <input id='speedIncreaseBackgroundInput' type='number' value='' placeholder='same' min='0' style='width: 50px;transform: translateY(-2px);' oninput='setOption("speedIncreaseBackground", parseFloat(this.value))' />
                <div id='speedIncreaseBackgroundWarning' class='small block' style='display:none'>${_txt("menu>options>speedIncreaseBackground_warning")}</div>
                <br>
                <button id='borrowTimeButton' class='button showthat control' onclick='borrowTime()'>${_txt("menu>options>borrow_time")}
                    <div class='showthis'>${_txt("menu>options>borrow_time_tooltip")}</div>
                </button>
                <div class='show-when-time-borrowed'>
                    <button id='returnTimeButton' class='button control' onclick='returnTime()'>${_txt("menu>options>return_time")}</button>
                    ${_txt("menu>options>time_borrowed")} <span id='borrowedTimeDays'></span>
                </div><br>
            </div>
        </li>`;
        return html;
    },
    htmlChallengeMenu() {
        const html = 
        `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>challenges>meta>title")}
            <div class='showthisH'>
                ${this.challenges()}
            </div>
        </li>`;
        return html;
    },
    htmlTotalsMenu() {
        const html = 
        `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>totals>meta>title")}
            <div class='showthisH'>
                ${this.totals()}
            </div>
        </li>`;
        return html;
    },
    htmlPrestigeMenu() {
        const html = 
        `<li tabindex='0' style='display:inline-block;height:30px;margin-left:10px;' class='showthatH'>
            ${_txt("menu>prestige_bonus>meta>title")}
            <div class='showthisH'>
                ${this.prestige_bonuses()}
            </div>
        </li>`;
        return html;
    },
    challenges() {
        let html = 
        `<div>Challenges are special modes that impose special conditions and heavy restrictions.<br> 
            They give no rewards ard are just here for fun.<br>
            It is only recommended to try them after beating the main game.<br>
            Please export and save your data locally before starting.<br>
            <b>Beginning a challenge will permanently delete your current save.</b><br>
            `;
        if (challengeSave.challengeMode !== 0 || 1===1)
            html += `<button class='button showthat control' style='margin-top: 2px;' onclick='exitChallenge()'>Exit Challenge 
                </button>
                <button class='button showthat control' style='margin-top: 2px;' onclick='resumeChallenge()'>Resume Challenge 
                </button><br>`;
        html += 
        `<button class='button showthat control' style='margin-top: 2px;' onclick='beginChallenge(1)'>Mana Drought 
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:100px;'>${_txt("menu>challenges>mana_drought")}</div>
        </button><br>
        <button class='button showthat control' style='margin-top: 2px;' onclick='beginChallenge(2)'>Noodle Arms
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:100px;'>${_txt("menu>challenges>noodle_arms")}</div>
        </button><br>
        <button class='button showthat control' style='margin-top: 2px;' onclick='beginChallenge(3)'>Mana Burn
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:100px;'>${_txt("menu>challenges>mana_burn")}</div>
        </button><br>`
        html += `</div>`
        return html;
    },
    totals() {
        let html =
        `<div>
        Effective Time: <div id='totalEffectiveTime'></div><br>
        Running Time: <div id='totalPlaytime'></div><br>
        <span class='show-when-time-borrowed'>${_txt("menu>options>time_borrowed")} <div id='borrowedTimeBalance'></div><br></span>
        Loops: <div id='totalLoops'></div><br>
        Actions: <div id='totalActions'></div><br>
        </div>`;
        return html;
    },
    prestige_bonuses() {
        let html =
        `<div><br> 
        Prestige bonuses are always active.<br>
        Each time you complete the game, you receive 90 points to spend on these bonuses.<br>
        Please export and save your data locally before attempting to trigger a prestige.<br>
        <br>
        <b>The ability to spec into prestige bonuses may be done at any time, but keep in mind this will reset ALL progress.</b>
        <br><br>
        Imbue Soul levels will carry over between prestiges, up to the maximum number of prestiges you've completed. <br>
        Max carryover possible: <div id='maxTotalImbueSoulLevels'></div>
        <br>
        <br><br><br>
        <b>Total Prestiges Completed: <div id='currentPrestigesCompleted'></div></b><br>
        Available points: <div id='currentPrestigePoints'></div> / <div id='totalPrestigePoints'></div>
        <br>
        Upgrade cost follows the format of: 
        <br>
        30 -> 40 -> 55 -> 75 -> 100 -> 130 -> ...
        <br>

        `;
        html +=
        
        `
        <br>
        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigePhysical")'>Prestige Physical
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigePhysical")}
                <br><br>
                Current Bonus: <div id='prestigePhysicalCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigePhysicalNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeMental")'>Prestige Mental
        <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeMental")}
            <br><br>
            Current Bonus: <div id='prestigeMentalCurrentBonus'></div>%<br>
            Next level cost: <div id='prestigeMentalNextCost'></div> points<br> 
        </div>
        </button><br>


        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeCombat")'>Prestige Combat
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeCombat")}
                <br><br>
                Current Bonus: <div id='prestigeCombatCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeCombatNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeSpatiomancy")'>Prestige Spatiomancy
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeSpatiomancy")}
                <br><br>
                Current Bonus: <div id='prestigeSpatiomancyCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeSpatiomancyNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeChronomancy")'>Prestige Chronomancy
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeChronomancy")}
                <br><br>
                Current Bonus: <div id='prestigeChronomancyCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeChronomancyNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeBartering")'>Prestige Bartering
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeBartering")}
                <br><br>
                Current Bonus: <div id='prestigeBarteringCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeBarteringNextCost'></div> points<br> 
            </div>
        </button><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='prestigeUpgrade("PrestigeExpOverflow")'>Prestige Experience Overflow
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeExpOverflow")}
                <br><br>
                Current Bonus: <div id='prestigeExpOverflowCurrentBonus'></div>%<br>
                Next level cost: <div id='prestigeExpOverflowNextCost'></div> points<br> 
            </div>
        </button><br>

        <br><br>

        <button class='button showthat control' style='margin-top: -50px;' onclick='resetAllPrestiges()'>Reset All Prestiges
            <div class='showthis' style='color:var(--default-color);width:230px;margin-left:200px;'>${_txt("menu>prestige_bonus>PrestigeResetAll")}
            </div>
        </button><br>

        `

        ;
        return html;
    }
});
