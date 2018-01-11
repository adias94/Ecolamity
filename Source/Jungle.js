

////////Jungle Obstacles///////////////////////////////////////////////////////////////////////////////////////////////////
var Tree = function(position_) {
    Obstacle.call(this, position_);
};
Tree.prototype = Object.create(Obstacle.prototype);
Tree.prototype.constructor = Tree;
Tree.prototype._sprite = new ObstacleSprite("tree.png", 2, 1);


////////Jungle Creatures////////////////////////////////////////////////////////////////////////////////////////////////////

////Behaviors

var DeerBehavior = function(deer_) {
    MildBehavior.call(this, deer_);
};
DeerBehavior.parent = MildBehavior;
DeerBehavior.prototype = Object.create(DeerBehavior.parent.prototype);
DeerBehavior.prototype.constructor = DeerBehavior;
DeerBehavior.prototype._commands = function() {
    //check area for predators
    var position = this._searchRadius(2,this._tileIsPredator);
    if(this._creature.foodMeterLevel <= 3 && position) {
        this._runFromPredator(position);
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
        this._steps = 0;
    }
    else DeerBehavior.parent.prototype._commands.call(this);
};

var BoarBehavior = function(boar_) {
    ErraticBehavior.call(this, boar_);
};
BoarBehavior.parent = ErraticBehavior;
BoarBehavior.prototype = Object.create(BoarBehavior.parent.prototype);
BoarBehavior.prototype.constructor = BoarBehavior;
BoarBehavior.prototype._commands = function() {
    //check area for predators
    var position = this._searchScope(this._creature.sightRange,this._tileIsPrey);
    if(this._creature.foodMeterLevel <= 2 && this._creature.canEat() && position) {
        this._approachPrey(position);
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
    }
    else BoarBehavior.parent.prototype._commands.call(this);
};

var BearBehavior = function(bear_) {
    ErraticBehavior.call(this, bear_);
};
BearBehavior.parent = ErraticBehavior;
BearBehavior.prototype = Object.create(BearBehavior.parent.prototype);
BearBehavior.prototype.constructor = BoarBehavior;
BearBehavior.prototype._commands = function() {
    var position = this._searchRadius(2,this._tileIsPrey);
    if(this._creature.foodMeterLevel === 1 && this._creature.canEat() && position) {
        this._approachPrey(position);
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
    }
    else BearBehavior.parent.prototype._commands.call(this);
};


////Prototypes
var Fern = function(position_,dayBorn_) { //plant
    Creature.call(this,position_,dayBorn_);
};
Fern.prototype = Object.create(Creature.prototype);
Fern.prototype.constructor = Fern;
Fern.prototype._behaviorType = PlantBehavior;
Fern.prototype._cooldownAfterRepr = Clock.convertDaysToHours(6);
Fern.prototype._lifespan = Clock.convertDaysToHours(12);
Fern.prototype._maturityPercent = 0.4;
Fern.prototype._numChildren = 2;
Fern.prototype._predatorList = [Deer, Boar];
Fern.prototype._sprite = new Sprite("fern.png",1,1);


var Deer = function(position_,dayBorn_) { //herbivore
    Animal.call(this,position_,dayBorn_);
};
Deer.prototype = Object.create(Animal.prototype);
Deer.prototype.constructor = Deer;
Deer.prototype._behaviorType = DeerBehavior;
Deer.prototype._lifespan = Clock.convertDaysToHours(15);
Deer.prototype._numChildren = 2;
Deer.prototype._predatorList = [Boar, Bear];
Deer.prototype._preyList = [Fern];
Deer.prototype._speed = new MoveSpeed(0.75, 2.0);
Deer.prototype._sprite = new AnimatedSprite("deer.png", "deer-sheet.png", 1, 1);


var Boar = function(position_,dayBorn_) { //omnivore
    Animal.call(this,position_,dayBorn_);
    this._sightRange = 1; //scope range which Boars looks for prey (based on food meter)
};
Boar.prototype = Object.create(Animal.prototype);
Boar.prototype.constructor = Boar;
Boar.prototype._behaviorType = BoarBehavior;
Boar.prototype._lifespan = Clock.convertDaysToHours(12);
Boar.prototype._predatorList = [Bear];
Boar.prototype._preyList = [Fern, Deer];
Boar.prototype._speed = new MoveSpeed(1.0, 1.25);
Boar.prototype._sprite = new AnimatedSprite("boar.png", "boar-sheet.png", 1, 1);

Object.defineProperties(Boar.prototype, {
    sightRange: { get: function() { return this._sightRange; } },
});
Boar.prototype.decFoodMeter = function() {
    Animal.prototype.decFoodMeter.call(this);
    this._adjustSightRange();
};
Boar.prototype.incFoodMeter = function() {
    Animal.prototype.incFoodMeter.call(this);
    this._adjustSightRange();
};
Boar.prototype._adjustSightRange = function() {
    switch(this._foodMeter.level) {
        case 1:  this._sightRange = 4; break;
        case 2:  this._sightRange = 2; break;
        default: this._sightRange = 1; break;
    }
};


var Bear = function(position_,dayBorn_) { //carnivore
    Animal.call(this,position_,dayBorn_);
    this._speed = new HungerBasedMoveSpeed(this._foodMeter);
};
Bear.prototype = Object.create(Animal.prototype);
Bear.prototype.constructor = Bear;
Bear.prototype._behaviorType = BearBehavior;
Bear.prototype._lifespan = Clock.convertDaysToHours(15);
Bear.prototype._maturityPercent = 0.50;
Bear.prototype._predatorList = [];
Bear.prototype._preyList = [Deer, Boar];
Bear.prototype._speed = null; //each bear will define its own moveSpeed object
Bear.prototype._sprite = new AnimatedSprite("bear.png", "bear-sheet.png", 1, 1);


////////Jungle Game/////////////////////////////////////////////////////////////////////////////////////////////////////////
var JungleGame = function(mapSize_, objectList_) {
    Game.call(this, mapSize_, objectList_);
};

JungleGame.prototype = Object.create(Game.prototype);
JungleGame.prototype.constructor = JungleGame;
JungleGame.prototype._mapBgFile = "jungle.png";
JungleGame.prototype._obstacleList = [Tree];
JungleGame.prototype._obstaclePercent = 0.25;
JungleGame.prototype._sidebarBgFile = "jungle_tile.png";
JungleGame.prototype._speciesList = [Fern,Deer,Boar,Bear];
