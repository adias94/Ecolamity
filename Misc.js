
////// Utilities ////////////////////////////////////////////////////////////////////////////////////////////////////

Math.genRndNum = function(min,max) { //generate a random number within range
    return Math.floor(Math.random() * (max - min + 1) + min);
};

Object.throwImplementationError = function (className,memberName) {
    throw ReferenceError("'" + memberName + "' has not been implemented by " + className);
};

Object.validateClass = function(object, members) { //check if each member has been implemented by 'object' (not undefined)
    for(var i = 0; i < members.length; i++) {   //'members' is an array of member names within 'object'
        if(object[members[i]] === undefined)
            Object.throwImplementationError(object.constructor.name, members[i]);
    }
};

var DOMUtility = function() { }; //utility class for extended DOM operations
DOMUtility.isMouseDown = false;
DOMUtility.assignElementById = function(id) { //return element in DOM, throw error if not found
    var element = document.getElementById(id);
    if(element === null) throw ReferenceError(id + " is not a valid element.");
    else return element;
};
DOMUtility.createDivWithClass = function(classname, parent) { //create a div element with specified 'class' & append to parent node
    var div = document.createElement("DIV");
    div.className = classname;
    return div;
};
DOMUtility.loadHtmlTemplate = function(templateFileName, actionAfterLoad) {
    //take the contents of an html file and load it into the current document's body (replacing old content)
    var xhr = new XMLHttpRequest();
    xhr.open("GET", templateFileName + ".html");
    xhr.responseType = "text";
    xhr.send();

    xhr.onreadystatechange = function() {
        if(xhr.response === null) return;
        document.body.innerHTML = xhr.responseText;
        if(xhr.readyState === 4) actionAfterLoad();
    };
};
DOMUtility.disableRightClickMenu = function() {
    document.body.addEventListener("contextmenu", function(event) {
        event.preventDefault();
    });
};
DOMUtility.preventElementHighlighting = function() { //prevent highlighting elements with mouse
    document.body.addEventListener("mousedown", function(event) {
        event.preventDefault();
        DOMUtility.isMouseDown = true;
    });
    document.body.addEventListener("mouseup", function() {
        DOMUtility.isMouseDown = false;
    });
};
DOMUtility.listenForImageLoadFailure = function() {
    document.body.addEventListener("error", function(e) { //throw error if any images do not load properly
        if(e.target.tagName === "IMG")
            throw ReferenceError(e.target.src + " is not a valid image.");
    }, true);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var Position = function(row_, col_) {
    this._row = row_;
    this._col = col_;
};
Position.prototype = {
    constructor: Position,

    get row() { return this._row; },
    get col() { return this._col; },
    set row(num) { this._row = this._setValue(num); },
    set col(num) { this._col = this._setValue(num); },

    clone: function() {
        return new Position(this._row, this._col);
    },
    equals:function(position) {
        if(this._row == position.row && this._col == position.col)
            return true;
        else return false;
    },
    setNewPosition: function(row, col) {
        this._row = this._setValue(row);
        this._col = this._setValue(col);
    },
    _setValue: function(val) {
        if(Number.isInteger(val)) return val;
        else throw TypeError("Attempted to set a non-numeric value.");
    },
};


var FoodMeter = function(startLevel_) {
    this._level = startLevel_;
};
FoodMeter.prototype = {
    _maxLevel: 4,
    _minLevel: 0,
    
    get level() { return this._level; },
    get maxLevel() { return this._maxLevel; },
    get minLevel() { return this._minLevel; },

    dec: function() {
        if(!this.isEmpty()) {
            this._level--;
            return true;
        }
        else return false;
    },
    inc: function() {
        if(!this.isFull()) {
            this._level++;
            return true;
        }
        else return false;
    },
    isEmpty: function() {
        if(this._level === this._minLevel) return true;
        else return false;
    },
    isFull: function() {
        if(this._level === this._maxLevel) return true;
        else return false;
    },
};

////// Sprite ////////////////////////////////////////////////////////////////////////////////////////////////////////

var Sprite = function(fileName_, tileLength_, tileWidth_) {
    this._fileName = fileName_;             //filename of sprite image
    this._image = this._setSprite();        //img element to represent creature sprite
    this._tileLength = tileLength_;
    this._tileWidth = tileWidth_;
};
Sprite.prototype = {
    constructor: Sprite,
    _directory: "images/sprites/",

    get image()  { return this._image; },
    get tileLength() { return this._tileLength; },
    get tileWidth()  { return this._tileWidth; },

    _setSprite: function() { //set sprite to a specific image
        return this._setImage(this._fileName);
    },
    _setImage: function(fileName, property) {
        var img = document.createElement("img");
        img.src = this._directory + fileName;
        return img;
    },

    getImageCopy: function() {
        return this._image.cloneNode();
    },
};


var ObstacleSprite = function(fileName_, tileLength_, tileWidth_) {
    Sprite.call(this, fileName_, tileLength_, tileWidth_);
};
ObstacleSprite.prototype = Object.create(Sprite.prototype);
ObstacleSprite.prototype.constructor = ObstacleSprite;
ObstacleSprite.prototype._directory = "images/obstacles/";


var AnimatedSprite = function(spriteFileName_, sheetFileName_, tileLength_, tileWidth_) {
    Sprite.call(this, spriteFileName_, tileLength_, tileWidth_);
    this._sheetFileName = sheetFileName_;
    this._sheet = this._setSheet();  //sprite sheet used to animate creature during movement
    this._sheet.onload = function() {
        this._numFrames = (this._sheet.width / this._image.width);
    }.bind(this);
};
AnimatedSprite.prototype = Object.create(Sprite.prototype);
AnimatedSprite.prototype.constructor = AnimatedSprite;
Object.defineProperties(AnimatedSprite.prototype, {
    numFrames: { get: function() { return this._numFrames; } },
    sheet: { get: function() { return this._sheet; } },
});
AnimatedSprite.prototype._setSheet = function() {
    return this._setImage(this._sheetFileName);
};


////// Move Speed ////////////////////////////////////////////////////////////////////////////////////////////////////

var MoveSpeed = function(maxSpeedCoeff_, minSpeedCoeff_) { 
    //"coefficient" is a multipler which is applied to the gamespeed to generate the creature's move speed
    this._maxSpeed = maxSpeedCoeff_;
    this._minSpeed = minSpeedCoeff_;
    this._validateCoefficients();
};
MoveSpeed.prototype = {
    constructor: MoveSpeed,
    _maxCoeff: 0.1,
    _minCoeff: 8.0,

    _validateCoefficients: function() {
        if(this._maxSpeed < this._maxCoeff || this._minSpeed > this._minCoeff)
            throw RangeError("Movespeed coefficients must be a value between " + this._maxCoeff + " and " + this._minCoeff);
        if(this._maxSpeed > this._minSpeed)
            throw RangeError("MaxSpeed coefficient must be a value lower than MinSpeed");
    },
    
    getMax: function(gameSpeed) {
        return gameSpeed * this._maxSpeed;
    },
    getMin: function(gameSpeed) {
        return gameSpeed * this._minSpeed;
    },
    getRandom: function(gameSpeed) { //set random movement speed between min/max speed of animal
        return Math.genRndNum(this.getMax(gameSpeed), this.getMin(gameSpeed));
    },
};

//move very slow if food meter high, move very fast if food meter low
var HungerBasedMoveSpeed = function(foodMeter_) {
    MoveSpeed.call(this, 1, 1);
    this._foodMeter = foodMeter_;
    this._currentMeterLevel = this._foodMeter.level;
    this._setSpeed();
};
HungerBasedMoveSpeed.prototype = Object.create(MoveSpeed.prototype);
HungerBasedMoveSpeed.prototype.constructor = HungerBasedMoveSpeed;
HungerBasedMoveSpeed.prototype.getMax = function(gameSpeed) {
    if(this._currentMeterLevel != this._foodMeter.level) this._setSpeed();
    return MoveSpeed.prototype.getMax.call(this, gameSpeed);
};
HungerBasedMoveSpeed.prototype.getMin = function(gameSpeed) {
    if(this._currentMeterLevel != this._foodMeter.level) this._setSpeed();
    return MoveSpeed.prototype.getMin.call(this, gameSpeed);
};
HungerBasedMoveSpeed.prototype._setSpeed = function() { //set min/max speed based on formula
    var level = this._foodMeter.level;
    this._minSpeed = this._speedFormula(level - 1);
    this._maxSpeed = this._speedFormula(level - 2);
    this._currentMeterLevel = level;
};
HungerBasedMoveSpeed.prototype._speedFormula = function(exp) { //sets movement speed to 2 to the 'exp' power
    return Math.pow(2, exp);
};

////// Obstacle ////////////////////////////////////////////////////////////////////////////////////////////////////

var Obstacle = function(position_) {
    this._position = position_;
};
Obstacle.prototype = {
    constructor: Obstacle,
    _sprite: undefined,

    get position() { return this._position.clone(); },
    get sprite() { return this._sprite; },
};