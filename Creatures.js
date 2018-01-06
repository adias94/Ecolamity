

var Creature = function(position_, dayBorn_) { //refers to all living creatures (plants and animals)
    this._age = 0;                      //age of creature, measured in hours
    this._behavior = new this._behaviorType(this);
    this._dayBorn = dayBorn_ || 1;
    this._hoursSinceReproduction = 0;
    this._inAnimation = false; //true if creature is currently in the process of moving to a new location
    this._isDead = false;
    this._position = position_; //row/col creature is located on the game map
    this._statsBlock = new this._statsBlockType(this);
};

Creature.prototype = {
    constructor: Creature,

    //members modifiable in subclasses
    _cooldownAfterRepr: Clock.convertDaysToHours(3),  //num hours after reproducing in which creature can start reproducing again
    _maturityPercent: 0.33,                     //percentage (0.01 - 0.99) of lifespan when a creature is old enough to reproduce
    _numChildren: 1,                            //number of children born at once when reproducing
    _statsBlockType: CreatureStatsBlock,        //type of block to create that keeps track of creature's stats


    //the following members must be implemented by subclasses
    _behaviorType:   undefined,       //each species must assign its own behavior class to initiate
    _lifespan:       undefined,       //number of hours a creature can live for
    _predatorList:   undefined,       //array of predators constructors, of species that will eat/kill you
    _sprite:         undefined,       //image to represent creature on gfxTable in DOM

    get ageInDays()     { return Clock.convertHoursToDays(this._age); },
    get dayBorn()       { return this._dayBorn; },
    get inAnimation()   { return this._inAnimation; },
    get isDead()        { return this._isDead; },
    get numChildren()   { return this._numChildren; },
    get position() { return this._position.clone(); },
    get sidebarIndex()  { return this._statsBlock.index; },
    get sprite()        { return this._sprite; },

    validateSpeciesClass: function() { //confirm all values have been implemented correctly by subclasses of Creature
        Object.validateClass(this, ["_lifespan", "_predatorList", "_sprite"]);
    },

    incAge: function() { //increment all hourly timers
        this._age++;
        this._statsBlock.updateAgeStat(this.ageInDays);
        this._hoursSinceReproduction++;
        if(this.atEndOfLife()) this.markAsDead();
    },
    atEndOfLife: function() {
        if(this._age >= this._lifespan) return true;
        else return false;
    },
    markAsDead: function() {
        this._isDead = true;
        this.stopBehavior();
        this._statsBlock.grayscaleImage();
    },
    isPredator: function(predator) {
        if(this._predatorList.indexOf(predator.constructor) !== -1) return true;
        else return false;
    },


    canReproduce: function() {    //default criteria for reproduction, each species can define its own criteria
        if(this._age >= this._lifespan * this._maturityPercent && 
            this._hoursSinceReproduction > this._cooldownAfterRepr) return true;
        else return false;
    },
    resetHoursSinceRepr: function() {
        this._hoursSinceReproduction = 0;
    },


    initializeBehavior: function(gameMap, speedSlider) {
        this._behavior.initialize(gameMap, speedSlider);
    },
    stopBehavior: function() { //stop animal behavior
        this._behavior.stopActivity();
    },
    toggleInAnimation: function() {
        this._inAnimation = !this._inAnimation;
    },
};


var Animal = function(position_,dayBorn_) {
    this._creaturesKilled = 0;
    this._foodMeter = new FoodMeter(3); //ranges from 1-4, keeps track of hunger of creature
    this._hoursSinceLastMeal = 0;
    Creature.call(this,position_,dayBorn_);
};

Animal.prototype = Object.create(Creature.prototype);
Animal.prototype.constructor = Animal;

//members modifiable in subclasses
Animal.prototype._cooldownAfterMeal = Clock.convertDaysToHours(1); //num hours after eating a meal in which the animal can start eating again
Animal.prototype._hoursToDecFoodMeter = Clock.convertDaysToHours(2);
Animal.prototype._statsBlockType = AnimalStatsBlock;

//must be implemented by all subclasses
Animal.prototype._speed = undefined;
Animal.prototype._preyList = undefined;     //array of prey constructors, of species that can be eaten/killed


Object.defineProperties(Animal.prototype, {
    creaturesKilled:    { get: function() { return this._creaturesKilled; } },
    foodMeterLevel:     { get: function() { return this._foodMeter.level; } },
    speed:              { get: function() { return this._speed; } },
    preyList:           { get: function() { return this._preyList; } },
});

Animal.prototype.validateSpeciesClass = function() { //confirm all values have been implemented correctly by subclasses of Animal
    Creature.prototype.validateSpeciesClass.call(this);
    Object.validateClass(this, ["_preyList", "_speed"]);
};
Animal.prototype.incAge = function() {
    Creature.prototype.incAge.call(this);
    this._incHoursSinceLastMeal();
};
Animal.prototype._incHoursSinceLastMeal = function() {
    this._hoursSinceLastMeal++;
    if(this._hoursSinceLastMeal % this._hoursToDecFoodMeter === 0) this.decFoodMeter();
};

Animal.prototype.canEat = function() { 
    if(!this._foodMeter.isFull() && this._hoursSinceLastMeal > this._cooldownAfterMeal) return true;
    else return false;
};
Animal.prototype.foodMeterIsEmpty = function() {
    return this._foodMeter.isEmpty();
};
Animal.prototype.foodMeterIsFull = function() {
    return this._foodMeter.isFull();
};
Animal.prototype.decFoodMeter = function() {
    this._foodMeter.dec();
    this._statsBlock.updateFoodMeterStat(this.foodMeterLevel);
    if(this.foodMeterIsEmpty()) this.markAsDead();
};
Animal.prototype.incFoodMeter = function() {
    if(this._foodMeter.inc()) {
        this._creaturesKilled++;
        this._statsBlock.updateFoodMeterStat(this.foodMeterLevel);
        this._statsBlock.updateCreaturesKilledStat(this._creaturesKilled);
        this._hoursSinceLastMeal = 0;
    }
};
Animal.prototype.isPrey = function(prey) {
    if(this._preyList.indexOf(prey.constructor) !== -1) return true;
    else return false;
};
Animal.prototype.move = function(position) { //move creature to specific index on 2d map
    this._position = position.clone();
};