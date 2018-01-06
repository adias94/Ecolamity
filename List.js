var List = function() {
    this._values = [];
};
List.prototype = {
    constructor: List,
    get length() { return this._values.length; },
    
    add: function(value) {
        this._values.push(value);
    },
    get: function(index) {
        return this._values[index];
    },
    remove: function(index) {            
        this._removeFromIndex(index);
    },
    _removeFromIndex: function(index) {
        if(!this._isValidIndex()) 
            throw RangeError("Attempted to remove an element at an invalid index.");
        for(var i = index + 1, len = this._values.length; i < len; i++) {
            this._values[i-1] = this._values[i];
        }
        this._values.pop();
    },
    _isValidIndex: function(index) {
        if(index < 0  || index >= this._values.length) return false;
        else return true;
    },
};

var CreatureList = function() { //contains all creatures currently alive during the game
    List.call(this);
    this._numAnimals = 0;
};
CreatureList.prototype = Object.create(List.prototype); 
CreatureList.prototype.constructor = CreatureList;
CreatureList.prototype.add = function(creature) {
    if(!(creature instanceof Creature)) throw TypeError("creature is not a Creature");
    if(creature instanceof Animal) this._numAnimals++;
    List.prototype.add.call(this,creature);
};
CreatureList.prototype.remove = function(creature) {
    var index = this._values.indexOf(creature);
    this._removeFromIndex(index);
    if(creature instanceof Animal) this._numAnimals--;
};
CreatureList.prototype.noAnimalsLeft = function() {
    return this._numAnimals === 0;
};


var ObjectList = function() {
    //each value is an object that has three members (class of creature to create, row, and col)
    List.call(this);
    this._numCreatures = 0;
    this._numObstacles = 0;
};
ObjectList.prototype = Object.create(List.prototype);
ObjectList.prototype.constructor = ObjectList;
Object.defineProperties(Object.prototype, {
    numCreatures: { get: function() { return this._numCreatures; } },
    numObstacles: { get: function() { return this._numObstacles; } },
});

ObjectList.prototype.add = function(ObjectClass, position_) {
    this._incCount(ObjectClass);
    List.prototype.add.call(this,{class: ObjectClass, position: position_ });
};
ObjectList.prototype.remove = function(index) {
    this._decCount(this._values[index].class);              
    this._removeFromIndex(index);
};
ObjectList.prototype._decCount = function(ObjectClass) {
    this._changeCount(ObjectClass, this._numCreatures - 1, this._numObstacles - 1);
};
ObjectList.prototype._incCount = function(ObjectClass) {
    this._changeCount(ObjectClass, this._numCreatures + 1, this._numObstacles + 1);
};
//base function for inc/dec # of creatures/obstacles in list
ObjectList.prototype._changeCount = function(ObjectClass, crtCount, obstCount) {
    if(ObjectClass.prototype instanceof Creature) this._numCreatures = crtCount;
    else if(ObjectClass.prototype instanceof Obstacle) this._numObstacles = obstCount;
    else throw TypeError("ObjectClass is not a constructor for a Creature or Obstacle.");
};
ObjectList.prototype.indexOf = function(position_) { //return object at the specified row/col
    var object;
    for(var i = 0, len = this._values.length; i < len; i++) {
        object = this._values[i];
        if(object.position.equals(position_)) return i;
    }
    return -1;
};