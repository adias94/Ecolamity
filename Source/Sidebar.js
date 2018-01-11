
var Clock = function(gameSpeed_, actionPerHour_) { //element that displays/controls the game time
    this._actionPerHour = actionPerHour_; //method to call every hour
    this._speedSlider = new SpeedSlider(gameSpeed_);

    this._day = 1;
    this._hour = 0;
    this._display = DOMUtility.assignElementById(this._id); //topmost section of sidebar which displays the game's day/hour
    this._timer = null;

    this._updateDisplay();
};
Clock.hoursPerDay = 24;
Clock.convertDaysToHours = function(numDays) { //used when assigning creature lifespan
    return numDays * Clock.hoursPerDay;
};
Clock.convertHoursToDays = function(numHours) {
    return Math.floor(numHours / Clock.hoursPerDay);
};
Clock.prototype = {
    _id: "time-display",

    get day()   { return this._day; },
    get hour()  { return this._hour; },
    get speed() { return this._speedSlider.currentSpeed; },

    start: function() { //create an event timer that increments game-time and performs time dependent events
        this._timer = setTimeout(function(self) { self._progress(); }, this.speed, this);
    },
    pause: function() {
        clearTimeout(this._timer);
        this._timer = null;
    },
    reset: function() {
        this._day = 1;
        this.hour = 0;
        this._updateDisplay();
    },

    _progress: function() {
        this._incHour();
        this._actionPerHour();
        if(this._timer !== null) this.start();
    },
    _incHour: function() {
        this._hour++;
        if(this._hour >= Clock.hoursPerDay) {
            this._hour = 0;
            this._day++;
        }
        this._updateDisplay();
    },
    _updateDisplay: function() { //update current day/hour
        this._display.textContent = "Day " + this._day + ", Hour " + this._hour;
    },
};

var SpeedSlider = function(speed_) {
    this._currentSpeed = speed_;
    this._defaultSpeed = speed_;

    this._slider = DOMUtility.assignElementById(this._id); //DIV element containing the slider
    this._optionButtons = this._slider.getElementsByTagName("SPAN"); //retrieve all speed options
    this._numOptions = this._optionButtons.length;

    this._checkIfOptionsValid(); //confirm that the number of options and multipliers match
    this._initiateSlider();    //initiate click event handler for slider
};
SpeedSlider.prototype = {
    _id: "speed-slider",
    _multiplierList: [1, 1.5, 2, 4, 8, 15], //list of possible speed settings to apply

    get currentSpeed() { return this._currentSpeed; },

    _checkIfOptionsValid: function() {
        if(this._numOptions !== this._multiplierList.length) 
            throw RangeError("The number of multipliers does not match the number of speed options.");
    },

    _initiateSlider: function() {
        this._setBgColorToYellow(0);
        for(var i = 0; i < this._numOptions; i++) {
            this._optionButtons[i].addEventListener('mouseover', (function(self, index) {
                return function() {
                    if(!DOMUtility.isMouseDown) return;
                    self._adjustSlider(index);
                };
            })(this, i));

            this._optionButtons[i].addEventListener('mousedown', (function(self, index) {
                return function() { self._adjustSlider(index); };
            })(this, i));
        }
    },
    _adjustSlider: function(index) { //adjust slider visuals to reflect new chosen speed
        for(var i = 0; i <= index; i++) {
            this._setBgColorToYellow(i);
        }
        for(var j = index + 1; j < this._numOptions; j++) {
            this._setBgColorToWhite(j);
        }
        this._currentSpeed = this._defaultSpeed / this._multiplierList[index]; //set new speed
    },
    _setBgColorToWhite: function(optionIndex) {
        this._setBgColor(optionIndex, "rgba(255,255,255,0.9)");
    },
    _setBgColorToYellow: function(optionIndex){
        this._setBgColor(optionIndex, "rgba(255,255,0,0.9)");
    },
    _setBgColor: function(optionIndex, rgbaValue) {
        this._optionButtons[optionIndex].style.backgroundColor = rgbaValue;
    },
};

var PauseButton = function(pauseMethod_, resumeMethod_) {
    this._button = DOMUtility.assignElementById("pause-button");
    this._setImage(this._pauseIMG);

    this._gamePaused = false;
    this._resumeMethod = resumeMethod_;
    this._pauseMethod = pauseMethod_;
    
    this._initiate();
};
PauseButton.prototype = {
    _imgDirectory: "images/buttons/", //relative path of pause button images
    _pauseIMG: "pause.png",
    _resumeIMG: "resume.png",

    get gamePaused() { return this._gamePaused; },

    _initiate: function() {
        this._button.addEventListener("click", this._clickAction.bind(this));
    },
    _clickAction: function() {
        if(!this._gamePaused) {
            this._setImage(this._resumeIMG);
            this._pauseMethod();
        }
        else {
            this._setImage(this._pauseIMG);
            this._resumeMethod();
        }

        this._gamePaused = !this._gamePaused;
    },
    _setImage: function(fileName) {
        this._button.src = this._imgDirectory + fileName;
    },
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var CreatureStatsBlock = function(creature) { //create a block to represent creature's stats in sidebar
    if(document.getElementById(this._blockContainerId) === null) {
        CreatureStatsBlock.prototype._numBlocks = 0;
        return;
    }

    this._DOMblock = DOMUtility.createDivWithClass(this._class); //'DIV' element containing all of creature's stats
    CreatureStatsBlock.prototype._numBlocks++;
    this._index = this._numBlocks;

    this._image;
    this._ageStat;
    this._dayBornStat;

    this._createAllStats(creature);
    this._appendStatsToBlock();
};
CreatureStatsBlock.prototype = {
    constructor: CreatureStatsBlock,
    _blockContainerId: "block-container",
    _class: "stats-block",
    _numBlocks: 0,

    get index() { return this._index; },

    _createAllStats: function(creature) {
        this._createImage(creature.sprite);
        this._createStat("_ageStat", "Age: ", creature.ageInDays);
        this._createStat("_dayBornStat", "Day Born: ", creature.dayBorn);
    },
    _createImage: function(creatureSprite) { //create copy of creature sprite and attach to block
        this._image = document.createElement("div");
        this._image.className = "sidebar-sprite";
        this._image.appendChild(creatureSprite.getImageCopy());

        var p = document.createElement("p"); //display sidebarIndex of creature next to sprite
        p.textContent = this._numBlocks;
        this._image.appendChild(p);

        this._DOMblock.appendChild(this._image);
    },
    _createStat: function(statElement, text, value) { //create and add a new stat to block, return a reference to node containing the stat
        if(this[statElement]) return;

        this[statElement] = document.createElement("P");
        this._updateStat(statElement, text, value);
        this._DOMblock.appendChild(this[statElement]);
    },
    _appendStatsToBlock: function() {
        document.getElementById("block-container").appendChild(this._DOMblock);
    },

    updateAgeStat: function(age) {
        this._updateStat("_ageStat", "Age: ", age);
    },
    _updateStat: function(statElement, text, value) {
        this[statElement].textContent = text + value;
    },

    grayscaleImage: function() {
        this._image.style.filter = "grayscale(100%)";
        this._image.style.filter = "gray";
    },
};

var AnimalStatsBlock = function(animal_) {
    this._foodMeterStat;
    this._creaturesKilledStat;
    CreatureStatsBlock.call(this,animal_);
};
AnimalStatsBlock.prototype = Object.create(CreatureStatsBlock.prototype);
AnimalStatsBlock.prototype.constructor = AnimalStatsBlock;
AnimalStatsBlock.prototype._createAllStats = function(animal) {
    CreatureStatsBlock.prototype._createAllStats.call(this, animal);
    this._createStat("_foodMeterStat", "Food Meter: ", animal.foodMeterLevel);
    this._createStat("_creaturesKilledStat", "Creatures Killed: ", animal.creaturesKilled);
},
AnimalStatsBlock.prototype.updateFoodMeterStat = function(foodMeterLevel) {
    this._updateStat("_foodMeterStat", "Food Meter: ", foodMeterLevel);
};
AnimalStatsBlock.prototype.updateCreaturesKilledStat = function(numKilled) {
    this._updateStat("_creaturesKilledStat", "Creatures Killed: ", numKilled);
};

var CactusStatsBlock = function(cactus_) {
    this._healthStat;
    CreatureStatsBlock.call(this,cactus_);
};
CactusStatsBlock.prototype = Object.create(CreatureStatsBlock.prototype);
CactusStatsBlock.prototype.constructor = CactusStatsBlock;
CactusStatsBlock.prototype._createAllStats = function(cactus) {
    CreatureStatsBlock.prototype._createAllStats.call(this, cactus);
    this._createStat("_healthStat", "Health: ", cactus.health);
},
CactusStatsBlock.prototype.updateHealthStat = function(health) {
    this._updateStat("_healthStat", "Health: ", health);
};
