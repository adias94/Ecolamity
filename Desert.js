
////////Desert Obstacles///////////////////////////////////////////////////////////////////////////////////////////////////
var Rock = function(position_) {
    Obstacle.call(this,position_);
};
Rock.prototype = Object.create(Obstacle.prototype);
Rock.prototype.constructor = Rock;
Rock.prototype._sprite = new ObstacleSprite("rock.png", 1, 1);

////////Desert Creatures///////////////////////////////////////////////////////////////////////////////////////////////////

////Behaviors
var SnakeBehavior = function(snake_) {
    ErraticBehavior.call(this, snake_);
};
SnakeBehavior.parent = ErraticBehavior;
SnakeBehavior.prototype = Object.create(SnakeBehavior.parent.prototype);
SnakeBehavior.prototype.constructor = SnakeBehavior;
SnakeBehavior.prototype._commands = function() {
    var position = this._searchRadius(1,this._tileIsPredator);
    if(position) this._action.attackEnemy(position);
    SnakeBehavior.parent.prototype._commands.call(this);
};

var CoyoteBehavior = function(coyote_) {
    MildBehavior.call(this, coyote_);
};
CoyoteBehavior.parent = MildBehavior;
CoyoteBehavior.prototype = Object.create(CoyoteBehavior.parent.prototype);
CoyoteBehavior.prototype.constructor = CoyoteBehavior;
CoyoteBehavior.prototype._commands = function() {
    var position = this._searchScope(this._game.map.size - 1, this._tileIsPrey);
    if(this._creature.foodMeterLevel === 1 && this._creature.canEat() && position) {
        this._approachPrey(position);
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
    }
    else if(this._creature.foodMeterLevel === 4) {
        this._moveSpeed = this._creature.speed.getMax(this._game.speed);
        this._moveRandomDirection();
        this._steps--;
    }
    else CoyoteBehavior.parent.prototype._commands.call(this);
};


////Prototypes
var Cactus = function(position_,dayBorn_) {
    this._health = 3; //number of times the cactus can be attacked before it is dead
    Creature.call(this,position_,dayBorn_);
};
Cactus.prototype = Object.create(Creature.prototype);
Cactus.prototype.constructor = Cactus;
Cactus.prototype._behaviorType = PlantBehavior;
Cactus.prototype._lifespan = Clock.convertDaysToHours(20);
Cactus.prototype._cooldownAfterRepr = Cactus.prototype._lifespan / 2;
Cactus.prototype._maturityPercent = 0.45;
Cactus.prototype._predatorList = [Iguana];
Cactus.prototype._sprite = new Sprite("cactus.png", 1, 1);
Cactus.prototype._statsBlockType = CactusStatsBlock;
Object.defineProperties(Cactus.prototype, {
    health: { get: function() {return this._health; } },
});
Cactus.prototype.markAsDead = function() {
    if(this._health > 0) this._health--;
    this._statsBlock.updateHealthStat(this._health);
    if(this._health === 0) Creature.prototype.markAsDead.call(this);
};


var Iguana = function(position_,dayBorn_) {
    Animal.call(this,position_,dayBorn_);
};
Iguana.prototype = Object.create(Animal.prototype);
Iguana.prototype.constructor = Iguana;
Iguana.prototype._behaviorType = LinearBehavior;
Iguana.prototype._lifespan = Clock.convertDaysToHours(8);
Iguana.prototype._hoursToDecFoodMeter = Clock.convertDaysToHours(1.5);
Iguana.prototype._maturityPercent = 0.6;
Iguana.prototype._numChildren = 3;
Iguana.prototype._predatorList = [Snake, Coyote];
Iguana.prototype._preyList = [Cactus];
Iguana.prototype._speed = new MoveSpeed(0.6, 0.9);
Iguana.prototype._sprite = new AnimatedSprite("iguana.png", "iguana-sheet.png", 1, 1);


var Snake = function(position_,dayBorn_) {
    Animal.call(this,position_,dayBorn_);
};
Snake.prototype = Object.create(Animal.prototype);
Snake.prototype.constructor = Snake;
Snake.prototype._behaviorType = SnakeBehavior;
Snake.prototype._lifespan = Clock.convertDaysToHours(12);
Snake.prototype._numChildren = 2;
Snake.prototype._predatorList = [Coyote];
Snake.prototype._preyList = [Iguana];
Snake.prototype._speed = new MoveSpeed(1.5, 2.5);
Snake.prototype._sprite = new AnimatedSprite("snake.png", "snake-sheet.png", 1, 1);


var Coyote = function(position_,dayBorn_) {
    Animal.call(this,position_,dayBorn_);
};
Coyote.prototype = Object.create(Animal.prototype);
Coyote.prototype.constructor = Coyote;
Coyote.prototype._behaviorType = CoyoteBehavior;
Coyote.prototype._lifespan = Clock.convertDaysToHours(10);
Coyote.prototype._maturityPercent = 0.5;
Coyote.prototype._predatorList = [];
Coyote.prototype._preyList = [Iguana, Snake];
Coyote.prototype._speed = new MoveSpeed(0.75, 1.75);
Coyote.prototype._sprite = new AnimatedSprite("coyote.png", "coyote-sheet.png", 1, 1);


////////Desert Game////////////////////////////////////////////////////////////////////////////////////////////////////////
var DesertGame = function(mapSize_, objectList_) {
    Game.call(this, mapSize_, objectList_);
};
DesertGame.prototype = Object.create(Game.prototype);
DesertGame.prototype.constructor = DesertGame;
DesertGame.prototype._mapBgFile = "desert.png";
DesertGame.prototype._obstacleList = [Rock];
DesertGame.prototype._obstaclePercent = 0.05;
DesertGame.prototype._sidebarBgFile = "desert_tile.png";
DesertGame.prototype._speciesList = [Cactus,Iguana,Snake,Coyote];