
////////Ocean Creatures///////////////////////////////////////////////////////////////////////////////////////////////////

////Behaviors

var PlanktonBehavior = function(plankton_) {
    ErraticBehavior.call(this, plankton_);
};
PlanktonBehavior.parent = ErraticBehavior;
PlanktonBehavior.prototype = Object.create(PlanktonBehavior.parent.prototype);
PlanktonBehavior.prototype.constructor = PlanktonBehavior;
PlanktonBehavior.prototype._actionAfterMove = function() { };


TunaBehavior = function(tuna_) {
    LinearBehavior.call(this, tuna_);
};
TunaBehavior.parent = LinearBehavior;
TunaBehavior.prototype = Object.create(TunaBehavior.parent.prototype);
TunaBehavior.prototype.constructor = TunaBehavior;
TunaBehavior.prototype._commands = function() {
    var position = this._searchRadius(3,this._tileIsPredator);
    if(this._creature.foodMeterLevel <= 2 && position) {
        this._runFromPredator(position);
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
        this._steps = 0;
    }
    else TunaBehavior.parent.prototype._commands.call(this);
};

var OctopusBehavior = function(octopus_) {
    MildBehavior.call(this, octopus_);
};
OctopusBehavior.parent = MildBehavior;
OctopusBehavior.prototype = Object.create(OctopusBehavior.parent.prototype);
OctopusBehavior.prototype.constructor = OctopusBehavior;
OctopusBehavior.prototype._commands = function() {
    var position = this._searchDiagScope(2, this._tileIsPrey);
    if(this._creature.foodMeterLevel === 2 && this._creature.canEat() && position) {
        this._approachPrey(position);
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
    }
    else OctopusBehavior.parent.prototype._commands.call(this);
};
OctopusBehavior.prototype._actionAfterMove = function() {
    var position = this._searchDiagScope(1,this._tileIsPrey);
    if(position) this._huntForPrey(position);
    position = this._searchDiagScope(1,this._tileIsSameSpecies);
    if(position) this._reproduce(this._game.map.getAtLocation(position));
};


////Prototypes
var Plankton = function(position_,dayBorn_) {
    Creature.call(this,position_,dayBorn_);
};
Plankton.prototype = Object.create(Creature.prototype);
Plankton.prototype.constructor = Plankton;
Plankton.prototype._behaviorType = PlanktonBehavior;
Plankton.prototype._lifespan = 0; //lives forever
Plankton.prototype._predatorList = [Tuna, Octopus];
Plankton.prototype._speed = new MoveSpeed(8.0, 8.0);
Plankton.prototype._sprite = new AnimatedSprite("plankton.png", "plankton-sheet.png", 1, 1);
Object.defineProperties(Plankton.prototype, {
    speed: { get: function() { return this._speed; } },
});
Plankton.prototype.markAsDead = function() { }; //do nothing, since plankton cannot die
Plankton.prototype.move = function(position) {
    this._position = position.clone();
};


var Tuna = function(position_,dayBorn_) {
    Animal.call(this,position_,dayBorn_);
};
Tuna.prototype = Object.create(Animal.prototype);
Tuna.prototype.constructor = Tuna;
Tuna.prototype._behaviorType = TunaBehavior;
Tuna.prototype._lifespan = Clock.convertDaysToHours(15);
Tuna.prototype._numChildren = 2;
Tuna.prototype._predatorList = [Octopus, Shark];
Tuna.prototype._preyList = [Plankton];
Tuna.prototype._speed = new MoveSpeed(0.6, 3.0);
Tuna.prototype._sprite = new AnimatedSprite("tuna.png", "tuna-sheet.png", 1, 1);


var Octopus = function(position_,dayBorn_) {
    Animal.call(this,position_,dayBorn_);
};
Octopus.prototype = Object.create(Animal.prototype);
Octopus.prototype.constructor = Octopus;
Octopus.prototype._behaviorType = OctopusBehavior;
Octopus.prototype._hoursToDecFoodMeter = Clock.convertDaysToHours(1.5);
Octopus.prototype._lifespan = Clock.convertDaysToHours(10);
Octopus.prototype._maturityPercent = 0.15;
Octopus.prototype._predatorList = [Shark];
Octopus.prototype._preyList = [Plankton, Tuna];
Octopus.prototype._speed = new MoveSpeed(0.9, 1.2);
Octopus.prototype._sprite = new AnimatedSprite("octopus.png", "octopus-sheet.png", 1, 1);
Octopus.prototype.isPrey = function(prey) {
    if(this._foodMeter.level === 1 && prey instanceof Octopus) return true;
    else return Animal.prototype.isPrey.call(this, prey);
}


var Shark = function(position_,dayBorn_) {
    Animal.call(this,position_,dayBorn_);
};
Shark.prototype = Object.create(Animal.prototype);
Shark.prototype.constructor = Shark;
Shark.prototype._behaviorType = LinearBehavior;
Shark.prototype._cooldownAfterMeal = Clock.convertDaysToHours(1.5);
Shark.prototype._hoursToDecFoodMeter = Clock.convertDaysToHours(3);
Shark.prototype._lifespan = Clock.convertDaysToHours(22);
Shark.prototype._predatorList = [];
Shark.prototype._preyList = [Tuna, Octopus];
Shark.prototype._speed = new MoveSpeed(2.0, 4.0);
Shark.prototype._sprite = new AnimatedSprite("shark.png", "shark-sheet.png", 1, 1);


////////Ocean Game////////////////////////////////////////////////////////////////////////////////////////////////////////
var OceanGame = function(mapSize_, objectList_) {
    Game.call(this, mapSize_, objectList_);
};
OceanGame.prototype = Object.create(Game.prototype);
OceanGame.prototype.constructor = OceanGame;
OceanGame.prototype._mapBgFile = "ocean.png";
OceanGame.prototype._obstacleList = [];
OceanGame.prototype._obstaclePercent = 0;
OceanGame.prototype._sidebarBgFile = "ocean_tile.png";
OceanGame.prototype._speciesList = [Plankton, Tuna, Octopus, Shark];