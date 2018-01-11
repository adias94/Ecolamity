
var Behavior = function(creature_) {
    this._activeTimer = null;             //keeps track of behavior
    this._creature = creature_;
    this._game;                           //reference to the game in which the creature exists

    this._moveRandomDirection; //gets assigned a move method to call during behavior
    this._moveSpeed = 0;
    this._steps = 0; //number of tiles to move in a specified direction
};
Behavior.prototype = {
    constructor: Behavior,
    _directions: [GameMap.prototype.moveCreatureUp, GameMap.prototype.moveCreatureDown,
        GameMap.prototype.moveCreatureLeft, GameMap.prototype.moveCreatureRight],

    initialize: function(game_) {
        if(!(game_ instanceof Game)) throw TypeError("'game_' is not an instance of Game");
        if(this._activeTimer !== null) this.stopActivity();
        this._game = game_;
        this._moveSpeed = (this._creature.speed) ? this._creature.speed.getRandom(this._game.speed) : 0;
        this._nextSequence();
    },

    _sequence: function() { //chain of command for creature behavior
        this._commands();
        this._actionAfterMove();
        this._nextSequence();
    },
    _commands: function() {
        if(this._steps === 0) {  //generate new direction to travel
            this._steps = this._generateNumSteps();  //num steps in a certain direction deer will move
            this._moveRandomDirection = this._getRandomDirection();
        }
        
        this._moveSpeed = this._creature.speed.getRandom(this._game.speed);
        this._moveRandomDirection();
        this._steps--;
    },
    _actionAfterMove: function() {
        //check surrounding area for prey or mates
        var position = this._searchScope(1,this._tileIsPrey);
        if(position) this._huntForPrey(position);
        position = this._searchScope(1,this._tileIsSameSpecies);
        if(position) this._reproduce(this._game.map.getAtLocation(position));
    },
    _nextSequence: function() {
        this._activeTimer = setTimeout(function(self) { self._sequence(); }, this._moveSpeed, this);        
    },

    _generateNumSteps: function() { //must be implemented by subclasses
        Object.throwImplementationError(this.constructor.name, "_generateNumSteps");
    },
    _getRandomDirection: function() {
        return function() {
            this._directions[Math.genRndNum(0,3)].call(this._game.map, this._creature, this._moveSpeed);
        };
    },
   
    stopActivity: function() {
        clearTimeout(this._activeTimer);
        this._activeTimer = null;
    },

    ////list of search methods 
    ///check all tiles within range of creature using a specified pattern for some kind of condition
    _searchRadius: function(range, predicateMethod) {
        var leftCol, rightCol, topRow, bottomRow, position;
        for(var radius = 1; radius <= range; radius++) { 
            leftCol = this._creature.position.col - radius; rightCol = this._creature.position.col + radius;
            topRow = this._creature.position.row - radius;  bottomRow = this._creature.position.row + radius;
            for(var i = 0, max = radius * 2; i < max; i++) {
                position = new Position(bottomRow - i, leftCol); //check left col
                if(predicateMethod.call(this, position)) return position;
                position = new Position(topRow + i, rightCol);   //check right col
                if(predicateMethod.call(this, position)) return position;
                position = new Position(topRow, leftCol + i);    //check top row
                if(predicateMethod.call(this, position)) return position;
                position = new Position(bottomRow, rightCol - i); //check bottom row
                if(predicateMethod.call(this, position)) return position;
            }
        }

        return false;
    },
    _searchScope: function(range, predicateMethod) {
        var position, creaturePos = this._creature.position;
        for(var i = 1; i <= range; i++) {
  	        position = new Position(creaturePos.row - i, creaturePos.col);  //check top
            if(predicateMethod.call(this, position)) return position;
            position = new Position(creaturePos.row + i, creaturePos.col);  //check bottom
            if(predicateMethod.call(this, position)) return position;
            position = new Position(creaturePos.row, creaturePos.col - i);  //check left
            if(predicateMethod.call(this, position)) return position;
            position = new Position(creaturePos.row, creaturePos.col + i);  //check right
            if(predicateMethod.call(this, position)) return position;
        }
        return false;
    },
    _searchDiagScope: function(range, predicateMethod) {
        var position, creaturePos = this._creature.position;
        for(var i = 1; i <= range; i++) {
  	        position = new Position(creaturePos.row - i, creaturePos.col - i);  //check top left
            if(predicateMethod.call(this, position)) return position;
            position = new Position(creaturePos.row - i, creaturePos.col + i);  //check top right
            if(predicateMethod.call(this, position)) return position;
            position = new Position(creaturePos.row + i, creaturePos.col - i);  //check bottom left
            if(predicateMethod.call(this, position)) return position;
            position = new Position(creaturePos.row + i, creaturePos.col + i);  //check bottom right
            if(predicateMethod.call(this, position)) return position;
        }
        return false;
    },


    ////list of map checking methods (Predicate Methods)
    ///must be a method that takes a position and checks if it meets a specific condition
    _tileIsEmpty: function(position) {
        if(this._game.map.getAtLocation(position) === 0) return true;
        else return false;
    },
    _tileIsSameSpecies: function(position) {
        if(this._creature.constructor === this._game.map.getAtLocation(position).constructor)
            return true;
        else return false;
    },
    _tileIsPrey: function(position) {
        return this._creature.isPrey(this._game.map.getAtLocation(position));
    },
    _tileIsPredator: function(position) {
        return this._creature.isPredator(this._game.map.getAtLocation(position));
    },

    ////list of actions
    _approachPrey: function(position) {
        var maxSpeed = this._creature.speed.getMax(this._game.speed);
        var col = position.col, row = position.row;
        var creatureCol = this._creature.position.col, creatureRow = this._creature.position.row;

             if(col < creatureCol && this._game.map.moveCreatureLeft(this._creature, maxSpeed));
        else if(col > creatureCol && this._game.map.moveCreatureRight(this._creature, maxSpeed));
        else if(row < creatureRow && this._game.map.moveCreatureUp(this._creature, maxSpeed));
        else if(row > creatureRow && this._game.map.moveCreatureDown(this._creature, maxSpeed));
    },
    _attackEnemy: function(position) { //kill a predator (without eating it) if its food meter is lower
        var enemy = this._game.map.getAtLocation(position);
        if(this._creature.isPredator(enemy) && 
            this._creature.foodMeterLevel > enemy.foodMeterLevel) 
        {
            enemy.markAsDead();
        }
    },
    _huntForPrey: function(position) {
        var prey = this._game.map.getAtLocation(position);
        if(this._creature.canEat() && this._creature.isPrey(prey)) {
            prey.markAsDead();
            this._creature.incFoodMeter();
        }
    },

    _reproduce: function(mate) {
        if(mate === undefined || this._creature === mate) return;
        if(this._creature.constructor !== mate.constructor) return;
        if(!this._creature.canReproduce() || !mate.canReproduce()) return;
        
        this._createChild(mate);
    },
    _createChild: function(mate) {
        var positionToSpawn;
        for(var i = 0; i < this._creature.numChildren; i++) { //create each child
            //find an empty nearby position to spawn the child
            positionToSpawn = this._searchScope(1, this._tileIsEmpty);
            if(positionToSpawn) {
                this._game.initializeNewCreature(this._creature.constructor, positionToSpawn);
            }
        }
        this._creature.resetHoursSinceRepr();
        if(mate !== undefined) mate.resetHoursSinceRepr();
    },
    
    _runFromPredator: function(position) {
        var maxSpeed = this._creature.speed.getMax(this._game.speed);
        var col = position.col, row = position.row;
        var creatureCol = this._creature.position.col, creatureRow = this._creature.position.row;
            
             if(col < creatureCol && this._game.map.moveCreatureRight(this._creature, maxSpeed));
        else if(col > creatureCol && this._game.map.moveCreatureLeft(this._creature, maxSpeed));
        else if(row < creatureRow && this._game.map.moveCreatureDown(this._creature, maxSpeed));
        else if(row > creatureRow && this._game.map.moveCreatureUp(this._creature, maxSpeed));
    },
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var ErraticBehavior = function(creature_) { //move in random patterns
    Behavior.call(this,creature_);
};
ErraticBehavior.prototype = Object.create(Behavior.prototype);
ErraticBehavior.prototype.constructor = ErraticBehavior;
ErraticBehavior.prototype._generateNumSteps = function() { return 1; };

var MildBehavior = function(creature_) { //move in somewhat straight patterns
    Behavior.call(this,creature_);
};
MildBehavior.prototype = Object.create(Behavior.prototype);
MildBehavior.prototype.constructor = MildBehavior;
MildBehavior.prototype._generateNumSteps = function() {
    return Math.genRndNum(1, Math.floor(Math.sqrt(this._game.map.size)));
};

var LinearBehavior = function(creature_) { //move in very straight patterns
    Behavior.call(this,creature_);
};
LinearBehavior.prototype = Object.create(Behavior.prototype);
LinearBehavior.prototype.constructor = LinearBehavior;
LinearBehavior.prototype._generateNumSteps = function() {
    return Math.genRndNum(2, this._game.map.size - 1);
};

var PlantBehavior = function(plant_) { //does not move, behavior only involves reproducing
    Behavior.call(this,plant_);
};
PlantBehavior.prototype = Object.create(Behavior.prototype);
PlantBehavior.prototype.constructor = PlantBehavior;
PlantBehavior.prototype._commands = function() {
    this._reproduce();
};
PlantBehavior.prototype._actionAfterMove = function() { }; //do nothing
PlantBehavior.prototype._generateNumSteps = function() { return 0; };
PlantBehavior.prototype._reproduce = function() {
    if(this._creature.canReproduce())
        this._createChild();
};