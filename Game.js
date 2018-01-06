
var Game = function(mapSize_, objectList_) {
    this._validateGameClass();

    this._clock = new Clock(this._defaultSpeed, this._actionPerHour.bind(this)); //controls display and passage of time
    this._creatureList = new CreatureList(); //list of all alive creatures on the map
    this._map = new GameMap(mapSize_, this._mapBgFile); //environment/map in which creatures live    
    this._pauseButton = new PauseButton(this._stopTime.bind(this), this._resumeTime.bind(this)); //stops/resumes game activity

    this._setSidebarBg();
    this._initiateReturnArrow();
    this._spawnAllObjects(objectList_);

    setTimeout(function() { //automatically start the game once it has fully loaded
        this._resumeTime();
    }.bind(this), 1000);
};

Game.prototype = { //abstract game class, each environment type should inherit this class
    constructor: Game,
    _defaultSpeed: 2400, //default speed of game (ms)

    //must by implemented by all subclasses
    _mapBgFile: undefined,          //image to be used as map background
    _obstacleList: undefined,       //list of obstacles that can be placed on the map
    _obstaclePercent: undefined,    //percentage of the map that will contain obstacles (0.00-1.00)
    _sidebarBgFile: undefined,      //image to be used as sidebar background
    _speciesList: undefined,        //array of constructors of all existing species

    get defaultSpeed() { return Game.prototype._defaultSpeed; },
    get speed() { return this._clock.speed; }, //current speed of the game, lower means fasters

    get map() { return this._map; },
    get mapBgFile() { return this._mapBgFile; },
    get obstacleList() { return this._obstacleList; },
    get obstaclePercent() { return this._obstaclePercent; },
    get sidebarBgFile() { return this._sidebarBgFile; },
    get speciesList() { return this._speciesList; },
    

    _validateGameClass: function() { //confirm all values have been implemented correctly by subclasses of Game
        Object.validateClass(this, ["_mapBgFile", "_obstacleList", "_obstaclePercent", 
                                "_sidebarBgFile", "_speciesList"]);
        for(var j = 0; j < this._speciesList.length; j++) { //check if each species implements all necessary members
            this._speciesList[j].prototype.validateSpeciesClass();
        }
    },
    _setSidebarBg: function() {
        document.getElementById("stats-sidebar").style.background = 
            "url('images/backgrounds/" + this._sidebarBgFile + "') repeat";
    },
    _initiateReturnArrow: function() { //return back to Map Edit Screen on click
        var self = this;
        document.getElementById("return-arrow").addEventListener("click", function() {
            self._stopTime();
            DOMUtility.loadHtmlTemplate("MapEdit", function() { mapEdit.initiateAssets(); });
        });
    },


    _spawnAllObjects: function(objectList) { //create every object in list and place them in proper position
        if(!(objectList instanceof ObjectList)) 
            throw TypeError("objectList is not an instance of ObjectList");
        
        var object, o;

        for(var i = 0, len = objectList.length; i < len; i++) {
            o = objectList.get(i);
            object = new o.class(o.position);
            this._map.setAtLocation(object, object.position);
            if(object instanceof Creature) this._creatureList.add(object);
        }
    },
    initializeNewCreature: function(CreatureClass,position) { //create a new creature on the map
        if(!(CreatureClass.prototype instanceof Creature))
            throw TypeError("CreatureClass is not a constructor for a creature");

        var creature = new CreatureClass(position,this._clock.day);
        this._creatureList.add(creature);
        this._map.setAtLocation(creature,position);  //place creature on the map
        creature.initializeBehavior(this);
    },

    ////action to bind to the clock object, performed every hour
    _actionPerHour: function() {
        if(this._creatureList.noAnimalsLeft()) this._endGame();
        else this._incAllCreatureAges();
    },
    _incAllCreatureAges: function() { //increment age & hours since last meal of every creature per hour
        var creature;
        for(var i = 0; i < this._creatureList.length; i++) {
            creature = this._creatureList.get(i);
            creature.incAge();
            if(creature.isDead) this._removeCreature(creature);
        }
    },
    _removeCreature: function(creature) {
        if(creature.inAnimation) return;
        this._map.clearLocation(creature);
        this._creatureList.remove(creature);
        creature.stopBehavior();
    },


    ////time manipulation methods
    _endGame: function() {
        this._stopTime();
        this._map.showGameOverScreen();
    },
    _stopTime: function() { //stop all game activity (including time and creature behavior)
        this._clock.pause();
        for(var i = 0, len = this._creatureList.length; i < len; i++)
            this._creatureList.get(i).stopBehavior();
    },
    _resumeTime: function() { //continue all game activity (including time and creature behavior)
        this._clock.start();
        for(var i = 0, len = this._creatureList.length; i < len; i++) {
            this._creatureList.get(i).initializeBehavior(this);
        }
    },
};