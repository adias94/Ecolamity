
var MainMenu = function() {
    this._chosenOption = 1; //reflects index w/i options of the current screen displayed (show How To Play)
    this._options = DOMUtility.assignElementById("menu-options").getElementsByTagName("li");
    this._screens = document.getElementsByClassName("second-menu-screen"); //list of all potential 2nd screens on main menu (DIV elements)
    this.initiateAssets();
};
MainMenu.prototype = {
    constructor: MainMenu,

    initiateAssets: function() {
        this._initiateStartGameButton();
        this._initiateOptionClick();
        this._changeScreen(this._chosenOption);
    },
    _initiateStartGameButton: function() {
        this._options[0].addEventListener("click", function() {
            DOMUtility.loadHtmlTemplate("MapEdit", function() { mapEdit = new MapEditScreen(); });
        });
    },
    _initiateOptionClick: function() { //show screen associated with option clicked
        var self = this;
        for(var i = 1; i < this._options.length; i++) {
            this._options[i].addEventListener("click", (function(j) {
                return function() { self._changeScreen(j); };
            })(i));
        }
    },
    _changeScreen: function(optionNum) {
        this._validateOption(optionNum);
        
        this._screens[this._chosenOption - 1].style.display = "none";
        this._screens[optionNum - 1].style.display = "block";
        this._chosenOption = optionNum;
    },
    _validateOption: function(optionNum) {
        if(optionNum < 1 || optionNum >= this._options.length)
            throw RangeError("option index must be a number between 1 and " + this._options.length);
    },
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MapEditScreen = function() {
    this._currentEnvIndex = 0; //index of the current environment selected from 'environmentList'
    this._environmentSelector;
    this._mapPreview;
    this._mapSize = this._minMapSize;
    this._randomEnabled = false;
    this._speciesImages;


    this._resetMap();
    this.initiateAssets();
};
MapEditScreen.prototype = {
    _id: "game",
    _bgPath: "images/backgrounds/",
    _buttonsPath: "images/buttons/",
    _environmentList: [ForestGame, DesertGame, OceanGame], //list all environments (subclasses of Game) here
	_environmentNames: ["Forest", "Desert", "Ocean"],
    _minMapSize: 6,
    _maxMapSize: 15,
    _speciesDescrFileNames: ["forest-desc.png", "desert-desc.png", "ocean-desc.png"], //image that lists descriptions about each species in environment
    _speciesDescrPath: "images/descriptions/",

    get _currentEnv() { return this._environmentList[this._currentEnvIndex]; },
	get _currentEnvName() { return this._environmentNames[this._currentEnvIndex]; },
    get _speciesList() { return this._currentEnv.prototype.speciesList; },
    get _selectedSpecies() { return this._speciesList[this._selectedSpeciesIndex]; },
    get _speciesDescr() { return this._speciesDescrPath + this._speciesDescrFileNames[this._currentEnvIndex]; },
    
    _resetMap: function() { //spawn a completely new map
        this._createNewMap();
        this._mapPreview.generateObstacles(this._currentEnv.prototype);
        if(this._randomEnabled) this._mapPreview.spawnRandomCreatures(this._speciesList);
    },
    //if an object list is passed, a new map will be created with the objects placed onto it
    _createNewMap: function(objectList) {
        this._mapPreview = 
            new MapPreview(this._mapSize, this._currentEnv.prototype.mapBgFile, this._selectedSpecies, objectList);
    },
    
    initiateAssets: function() { //initiate all event listeners for player interaction
        this._environmentSelector = DOMUtility.assignElementById("environment-selector");
        this._speciesImages = DOMUtility.assignElementById("species-list").getElementsByTagName("IMG");

        this._updateEnvironmentType();
        this._initiateArrows();
        this._initiateSpeciesSelect();
        this._initiateButtons();
        this._createNewMap(this._mapPreview.objectList);  //place objects currently in 'objectList' on map
    },

    _updateEnvironmentType: function() {
        this._updateEnvironmentName();
        this._updateBackground();
        this._updateSpeciesDetails();
        this._updateSpeciesImages();
    },
    _updateEnvironmentName: function() {
        this._environmentSelector.getElementsByTagName("P")[0].innerHTML = this._currentEnvName;
    },
    _updateBackground: function() {
        document.getElementById(this._id).style.background = 
            "url('" + this._bgPath + this._currentEnv.prototype.sidebarBgFile + "')";
    },
    _updateSpeciesDetails: function() {
        document.getElementById("species-description").firstElementChild.src = this._speciesDescr;
    },
    _updateSpeciesImages: function() { //update list of species displayed to current environment
        for(var i = 0; i < this._speciesList.length; i++) {
            this._speciesImages[i].src = this._speciesList[i].prototype.sprite.image.src;
        }
        this._setSelectedSpecies(this._speciesImages[0]);        
    },
    
    _initiateSpeciesSelect: function() {
        var self = this;
        DOMUtility.assignElementById("species-list").addEventListener("click", function(event) {
            self._setSelectedSpecies(event.target);
        });
    },
    _setSelectedSpecies: function(img) { //when user clicks on a species
        //img: image element that corresponds with the species to select
        if(img.tagName !== "IMG") return;

        for(var i = 0; i < this._speciesImages.length; i++) {
            this._speciesImages[i].style.backgroundColor = "";
            if(this._speciesImages[i] === img)
                this._selectedSpeciesIndex = i;
        }
        img.style.backgroundColor = "rgba(11,11,11,0.5)";

        this._mapPreview.newSelectedSpecies(this._selectedSpecies);
    },

    _initiateArrows: function() { //left/right arrows for the environment and map size selectors
        this._initiateEnvironmentArrows();
        this._initiateMapSizeArrows();
    },
    _initiateEnvironmentArrows: function() {
        var envArrows = this._environmentSelector.getElementsByClassName("arrow-button"), self = this;        
        envArrows[0].addEventListener("click", function() { //go to next environment on list
            if(self._currentEnvIndex === 0) self._currentEnvIndex = self._environmentList.length - 1;
            else self._currentEnvIndex--;

            self._updateEnvironmentType();  
            self._resetMap();
        });
        envArrows[1].addEventListener("click", function() { //go to previous environment on list
            if(self._currentEnvIndex === self._environmentList.length - 1) self._currentEnvIndex = 0;
            else self._currentEnvIndex++;

            self._updateEnvironmentType();
            self._resetMap();
        });
    },
    _initiateMapSizeArrows: function() {
        var self = this, sizeSelector = DOMUtility.assignElementById("size-selector");
        var sizeArrows = sizeSelector.getElementsByClassName("arrow-button");
        var mapSizeText = sizeSelector.getElementsByTagName("P")[0];
        mapSizeText.innerHTML = self._mapSize;

        sizeArrows[0].addEventListener("click", function() { //decrement map size
            if(self._mapSize === self._minMapSize) return;
            
            self._mapSize--;
            mapSizeText.innerHTML = self._mapSize;
            self._resetMap();
        });
        sizeArrows[1].addEventListener("click", function() { //increment map size
            if(self._mapSize === self._maxMapSize) return;
            
            self._mapSize++;
            mapSizeText.innerHTML = self._mapSize;
            self._resetMap();
        });
    },

    _initiateButtons: function() {
        var self = this;
        var buttons = document.getElementsByClassName("button");
        buttons[0].addEventListener("click", function() { //Start Game button
            DOMUtility.loadHtmlTemplate("Game", 
                function() { game = new self._currentEnv(self._mapSize, self._mapPreview.objectList); });
        });
        buttons[1].addEventListener("click", function() { //Reset Map button
            self._resetMap();
        });

        this._initiateRandomButtom();
        this._initiateReturnButton();
        this._initiateHelpButtons();        
    },
    _initiateRandomButtom: function() {
        var self = this;
        document.getElementById("random-toggle").getElementsByTagName("IMG")[0].addEventListener("click", function(event) {
            self._randomEnabled = !self._randomEnabled;            
            event.target.src = self._buttonsPath + 
                ( (self._randomEnabled) ? "on.png" : "off.png" );
            
            if(self._randomEnabled) self._mapPreview.spawnRandomCreatures(self._speciesList);
        });
        self._randomEnabled = false;
    },
    _initiateReturnButton: function() { //return to main menu
        document.getElementById("return-arrow").addEventListener("click", function() {
            DOMUtility.loadHtmlTemplate("MainMenu", function() { menu = new MainMenu(); });
        });
    },
    _initiateHelpButtons: function() { //hover over button to display message
        var helpButtons = document.getElementsByClassName("help-button");
        var helpMessages = document.getElementsByClassName("help-hover-text");

        //position hover message right next to the help button
        for(var i = 0; i < helpButtons.length; i++) {
            helpMessages[i].style.left = helpButtons[i].offsetLeft.toString() + "px";
            helpMessages[i].style.top = (helpButtons[i].offsetTop + helpButtons[i].clientHeight).toString() + "px";
            helpButtons[i].addEventListener("mouseover", (function(j) {
                return function() { helpMessages[j].style.display = "block"; };
            })(i));
            helpButtons[i].addEventListener("mouseout", (function(j) {
                return function() { helpMessages[j].style.display = "none"; };
            })(i));
        }
    },
};



//*** Interface ***//
var mapEdit, game, menu;
DOMUtility.disableRightClickMenu();
DOMUtility.listenForImageLoadFailure();
DOMUtility.preventElementHighlighting();
DOMUtility.loadHtmlTemplate("MainMenu", function() { menu = new MainMenu(); });