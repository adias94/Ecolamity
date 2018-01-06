
var GameCanvas = function(id_, mapSize_, bgFileName_) {
    this._canvas = DOMUtility.assignElementById(id_);

    this._canvas.height = this._canvas.scrollHeight;
    this._canvas.width = this._canvas.scrollWidth;

    this._pxTileSize = this._canvas.scrollWidth / mapSize_;  //the height/width in pixels of each tile
    this._frameInterval = this._pxTileSize / this._fps; //the rate(px) at which each frame moves during animation
    this._showCreatureIndex = false; //setting to indicate whether or not to show creature's index on map   

    this._context = this._canvas.getContext("2d");
    this._context.fillStyle = "white";
    this._context.font = "bold 70% " + this._font;
    this._setBackgroundImage(bgFileName_, mapSize_);
};
GameCanvas.prototype = {
    _bgDirectory: "images/backgrounds/",
    _font: "ArcadeAlternate, serif",
    _fps: 16, //frames per second
    

    _setBackgroundImage: function(imgFileName, mapSize) {
        var self = this;
        var img = document.createElement("IMG"); //temporarily create bg image to obtain its width
        img.src = this._bgDirectory + imgFileName;

        img.addEventListener("load", function() {
            var imgHeight = img.height / (mapSize / (self._canvas.height / 100)),
                imgWidth = img.width / (mapSize / (self._canvas.height / 100));
            self._canvas.style.background = "url('" + img.src + "') top left / " + imgHeight + "px " + imgWidth + "px";
        });
    },
    

    ////draw methods
    clearTile: function(position) {
        this._clearFromPosition(this._pxPos(position.col), this._pxPos(position.row));
    },
    _clearFromPosition: function(x,y) {
        this._context.clearRect(x, y, this._pxTileSize, this._pxTileSize);
    },

    drawIndex: function(index, position) {
        this._drawIndexOnPosition(index,this._pxPos(position.col),this._pxPos(position.row));
    },
    _drawIndexOnPosition: function(index, x, y) {
        if(this._showCreatureIndex)
            this._context.fillText(index, x + 3, y + 10);
    },

    drawSprite: function(sprite, position) {
        this._context.drawImage(sprite.image,
            this._pxPos(position.col), this._pxPos(position.row),
            this._pxTileSize * sprite.tileWidth, this._pxTileSize * sprite.tileLength);
    },
    drawOutlines: function() {
        var numRows = this._canvas.height / this._pxTileSize;
        var numCols = this._canvas.width / this._pxTileSize;
        for(var position = new Position(0,0); position.row < numRows; position.row++) {
            for(position.col = 0; position.col < numCols; position.col++) {
                this.drawOutlineAroundTile(position);
            }
        }
    },
    drawOutlineAroundTile: function(position) {
        this._context.strokeRect(this._pxPos(position.col), this._pxPos(position.row), 
            this._pxTileSize, this._pxTileSize);
    },


    _pxPos: function(tileIndex) { //convert row/col index to pixel location
        return tileIndex * this._pxTileSize;
    },

    ////map user interaction methods
    disableMapInteraction: function() {
        this._canvas.onclick = null;
        this._canvas.oncontextmenu = null;
    },
    enableMapInteraction: function(leftClickAction, rightClickAction) { //perform actions when user clicks a tile on the map
        if(leftClickAction.length !== 1 || rightClickAction.length !== 1)
            throw TypeError("ClickAction methods must have 1 arguments, consisting of map position.");
        var self = this;

        this._canvas.onclick = function(event) {
            self._clickAction(event, leftClickAction);
        };
        this._canvas.oncontextmenu = function(event) {
            self._clickAction(event, rightClickAction);
        };
    },
    _clickAction: function(event, action) {
        var x = event.pageX - event.target.offsetLeft, 
            y = event.pageY - event.target.offsetTop; //px position of mouse relative to map
        action(new Position(this._tilePos(y), this._tilePos(x)));
    },
    _tilePos: function(pxLoc) { //convert pixel location or row/col index
        return Math.floor(pxLoc / this._pxTileSize);
    },
    

    ////animation methods
    move: function(creature, sheetRowIndex, horiPxMove, vertPxMove, animationSpeed, actionAfterMove) {       
        animationSpeed = (animationSpeed / Game.prototype.defaultSpeed) * (1000 / this._fps);

        var self = this, creatureIndex = creature.sidebarIndex;
        //the range of frames to render from sprite sheet
        var sxIndex = 0, sxMax = creature.sprite.numFrames - 1;
        //current sprite position on canvas
        var dx = this._pxPos(creature.position.col), dy = this._pxPos(creature.position.row);
        //number of pixels to move per frame
        var xFrameInterval = horiPxMove * this._frameInterval, yFrameInterval = vertPxMove * this._frameInterval;

        //x/y position indicating that movement has completed to new tile
        var dx2 = (horiPxMove !== 0) ?
            (horiPxMove > 0 ? dx + this._pxTileSize : dx - this._pxTileSize) : dx;
        var dy2 = (vertPxMove !== 0) ? 
            (vertPxMove > 0 ? dy + this._pxTileSize : dy - this._pxTileSize) : dy;
        
        var animationDone; //check if creature has finished moving to proper location: true if done
        if(vertPxMove === 0) {
            animationDone = (horiPxMove > 0) ? 
                function() { return (dx2 <= dx + xFrameInterval); } :
                function() { return (dx + xFrameInterval <= dx2); };
        }
        else if(horiPxMove === 0) {
            animationDone = (vertPxMove > 0) ? 
                function() { return (dy2 <= dy + yFrameInterval); } :
                function() { return (dy + yFrameInterval <= dy2); };
        }
        else return;

        var animate = function() {
            self._clearFromPosition(dx,dy);
            dx += xFrameInterval; dy += yFrameInterval;
            self._drawAnimatedFrame(creature.sprite,sxIndex,sheetRowIndex,dx,dy);
            self._drawIndexOnPosition(creatureIndex, dx, dy);
                
            sxIndex = (sxIndex < sxMax) ? sxIndex + 1 : 0; //set next frame to render
            if(animationDone()) {
                //place sprite in exact tile position if coordinates are slighly off
                self._clearFromPosition(dx,dy);
                dx = dx2; dy = dy2;
                self._drawAnimatedFrame(creature.sprite,sxIndex,sheetRowIndex,dx,dy);
                self._drawIndexOnPosition(creatureIndex, dx, dy);
                actionAfterMove();
            }
            else setTimeout(function() { 
                requestAnimationFrame(animate); 
            }, animationSpeed);
        };

        requestAnimationFrame(animate);
    },
    _drawAnimatedFrame: function(animatedSprite,sxIndex,syIndex,dx,dy) {
        var spriteHeight = animatedSprite.image.height;
        var spriteWidth = animatedSprite.image.width;
        this._context.drawImage(animatedSprite.sheet,       //image
            sxIndex * spriteWidth, syIndex * spriteHeight,  //sx,sy
            spriteWidth, spriteHeight,                      //sw,sh
            dx, dy,                                         //dx,dy
            this._pxTileSize, this._pxTileSize);            //dw,dh
    },


    ////misc methods
    showGameOverScreen: function() {
        var pos = this._canvas.scrollWidth / 2;
        this._context.font = "50px " + this._font;
        this._context.fillText("GAME OVER", pos / 2, pos);
    },
    toggleShowCreatureIndex: function() {
        this._showCreatureIndex = !(this._showCreatureIndex);
    },
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var MapInterface = function(mapSize_, bgFileName_) {
    this._canvas = new GameCanvas(this._id,mapSize_,bgFileName_); //canvas element where game sprites are drawn
    this._grid;  //2d array representing the environment/map, contains creatures at their specified positions
    this._size = mapSize_;
    this._createGrid();
};
MapInterface.prototype = {
    constructor: MapInterface,
    _id: undefined, //id of canvas element representing map on DOM; must be defined by subclasses
    get size() { return this._size; },   

    _createGrid: function() {
        this._grid = [];
        for(var i = 0; i < this._size; i++) {
            this._grid.push([]);
            for(var j = 0; j < this._size; j++) {
                this._grid[i].push(0);
            }
        }
    }, 

    clearLocation: function(creature) { //set map location to 0
        if(!(creature instanceof Creature))
            throw TypeError("'creature' is not an instance of a Creature.");
        
        this._removeObjectFromGrid(creature, creature.position);
        this._canvas.clearTile(creature.position);
    },
    _removeObjectFromGrid: function(object, position) {
        this._setOnGrid(object, 0, position);
    },

    getAtLocation: function(position) { //return the value at the specied location on the map
        if(this._grid[position.row] === undefined || 
            this._grid[position.row][position.col] === undefined) return -1;
        else return this._grid[position.row][position.col];
    },

    setAtLocation: function(object,position) { //place object at the specified location on the map
        this._validateLocation(position);
        this._setObjectOnGrid(object,position);
        this._canvas.drawSprite(object.sprite, position);
        if(object instanceof Creature) this._canvas.drawIndex(object.sidebarIndex, position);
    },
    _validateLocation: function(position) { //throw error if invalid map location passed as parameter
        if(this._grid[position.row] === undefined || this._grid[position.row][position.col] === undefined) 
            throw RangeError("Value passed is outside the map index range.");
    },
    _setObjectOnGrid: function(object, position) {
        this._setOnGrid(object, object, position);
    },
    _setOnGrid: function(object, replacement, startPosition) {
       var position = startPosition.clone();
        for(var i = 0, L = object.sprite.tileLength; i < L; i++) { //fill all tiles on grid the obstacle occupies
            position.col = startPosition.col;

            for(var j = 0, W = object.sprite.tileWidth; j < W; j++) {
                this._grid[position.row][position.col] = replacement;
                position.col++;
            }
            position.row++;
        }
    },

    ////debug method, print grid's contents to console
    printToConsole: function(refreshSpeed, timerOn) {
        if(refeshSpeed && timerOn) { //print grid on interval, every 'refreshSpeed' ms, updating changes to grid
            var timer = setInterval(function() {
                console.clear();
                for(var i = 0; i < this._size; i++) {
                    console.log(this._grid[i]);
                }
            }.bind(this), refreshSpeed);
        }
        else { //print grid once
            for(var i = 0; i < this._size; i++) {
                console.log(this._grid[i]);
            }
        }
    },
};

var GameMap = function(mapSize_, bgFileName_) {
    MapInterface.call(this, mapSize_, bgFileName_);
    this._canvas.toggleShowCreatureIndex(); //show index of creatures on map
};
GameMap.prototype = Object.create(MapInterface.prototype);
GameMap.prototype.constructor = GameMap;
GameMap.prototype._id = "game-map";

GameMap.prototype.moveCreatureUp = function(creature, moveSpeed) {
    return this._move(creature,0,0,-1,moveSpeed);
};
GameMap.prototype.moveCreatureDown = function(creature, moveSpeed) {
    return this._move(creature,1,0,1,moveSpeed);
};
GameMap.prototype.moveCreatureLeft = function(creature, moveSpeed) {
    return this._move(creature,2,-1,0,moveSpeed);
};
GameMap.prototype.moveCreatureRight = function(creature, moveSpeed) {
    return this._move(creature,3,1,0,moveSpeed);
};
GameMap.prototype._move = function(creature, sheetRowIndex, horiPxMove, vertPxMove, moveSpeed) {
    if(creature.inAnimation) return false;
    var posToSet = new Position(creature.position.row + vertPxMove, creature.position.col + horiPxMove);
    if(this.getAtLocation(posToSet) !== 0) return false;
    var self = this;
    
    creature.toggleInAnimation();
    this._grid[creature.position.row][creature.position.col] = -1; //lock to/from position until movement animation completed
    this._grid[posToSet.row][posToSet.col] = -1;
    this._canvas.move(creature, sheetRowIndex, horiPxMove, vertPxMove, moveSpeed, function() {
        self._grid[creature.position.row][creature.position.col] = 0;
        self._grid[posToSet.row][posToSet.col] = creature;
        creature.move(posToSet);
        creature.toggleInAnimation();
    });
    return true;
};

GameMap.prototype.showGameOverScreen = function() {
    this._canvas.showGameOverScreen();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////Game Map representation on the Map Edit screen, in which the player places creatures on the map
var MapPreview = function(mapSize_, bgFileName_, selectedSpecies_, objectList_) {
    MapInterface.call(this, mapSize_, bgFileName_);
    this._objectList = new ObjectList();    //list of all objects currently placed on the map
    if(objectList_ !== undefined) this._applyObjectList(objectList_);
    this._selectedSpecies = selectedSpecies_; //species to place on map when user clicks a tile

    this._canvas.drawOutlines();
    this._initiateInteraction();
};
MapPreview.prototype = Object.create(GameMap.prototype);
Object.defineProperties(MapPreview.prototype, {
    objectList: { get: function() { return this._objectList; } },
});
MapPreview.prototype._id = "map-preview";

//enable player to click a tile to add creature to map, right-click a tile to remove creature from map
MapPreview.prototype._applyObjectList = function(objectList) {
    var object;
    for(var i = 0, len = objectList.length; i < len; i++) {
        object = objectList.get(i);
        this._placeObject(object.class, object.position);
    }
};
MapPreview.prototype._initiateInteraction = function() {
    this._canvas.disableMapInteraction();
    this._canvas.enableMapInteraction(
        this._placeSelectedSpecies.bind(this), 
        this._removeCreature.bind(this)
    );
};
MapPreview.prototype._placeSelectedSpecies = function(position) {
    if(this._objectList.numCreatures < this._size - 1)
        this._placeObject(this._selectedSpecies,position);
};

MapPreview.prototype.newSelectedSpecies = function(SpeciesClass) {
    if(!(SpeciesClass.prototype instanceof Creature))
        throw TypeError("'SpeciesClass' should be a constructor for a Creature");
    this._selectedSpecies = SpeciesClass;
};
MapPreview.prototype.generateObstacles = function(envirProto) { //randomly place obstacles on map
    if(!(envirProto instanceof Game))
        throw TypeError("'envirProto' should be a prototype for a Game subclass");

    var position = new Position(0,0);
    var rnd, ObstacleClass;
    var numTilesToPopulate = Math.floor(this._size * this._size * 
        envirProto.obstaclePercent); //total number of tiles to be taken up by obstacles on the map
    var obstacleList = envirProto.obstacleList;

    while(numTilesToPopulate > 0) {
        rnd = Math.genRndNum(0, obstacleList.length - 1); //index of obstacle to be selected at random
        ObstacleClass = obstacleList[rnd];
        do { //generate a random row/col index to place the obstacle
            position.row = Math.genRndNum(0,this._size - 1);
            position.col = Math.genRndNum(0,this._size - 1);
        } while(!this._canPlaceObstacle(ObstacleClass, position));
        
        this._placeObject(ObstacleClass, position);
        numTilesToPopulate -= 
            (ObstacleClass.prototype.sprite.tileLength * ObstacleClass.prototype.sprite.tileWidth);
    }
};
MapPreview.prototype._canPlaceObstacle = function(ObstacleClass, position_) {
    var positionToCheck = position_.clone();
    var obstLen = ObstacleClass.prototype.sprite.tileLength, obstWid;

    do { //check all tiles necessary to place obstacle at specified position; all must be empty
        positionToCheck.col = position_.col;
        obstWid = ObstacleClass.prototype.sprite.tileWidth;
        while(obstWid > 0 && this.getAtLocation(positionToCheck) === 0) {
            positionToCheck.col++;
            obstWid--;
        }
        positionToCheck.row++;
        obstLen--;
    } while(obstLen > 0 && obstWid === 0);

    if(obstLen === 0 && obstWid === 0) return true;
    else return false;
};
MapPreview.prototype._placeObject = function(ObjectClass, position) {
    if(!(ObjectClass.prototype instanceof Creature) && !(ObjectClass.prototype instanceof Obstacle))
        throw TypeError("'ObjectClass' should be a constructor for a Creature or Obstacle");
    position = position.clone();
    if(this.getAtLocation(position) !== 0) return;

    var object = new ObjectClass(position);    
    this._objectList.add(ObjectClass, position);
    this.setAtLocation(object, position); //place sprite on the map
};

//create specified number of creatures, randomly placed on map
MapPreview.prototype.spawnRandomCreatures = function(speciesList, num) {
    var creatureIndex, position = new Position(0,0);
    if(num === undefined) num = this._size - 1;

    this.removeAllCreatures();
    for(var i = 0; i < num; i++) {
        creatureIndex = Math.genRndNum(0, speciesList.length - 1);

        do { //generate a random row/col index to place the creature
            position.row = Math.genRndNum(0,this._size - 1);
            position.col = Math.genRndNum(0,this._size - 1);
        } while(this.getAtLocation(position) !== 0);

        this._placeObject(speciesList[creatureIndex],position);
    }
};


MapPreview.prototype.removeAllCreatures = function() {
    var object;
    for(var i = 0; i < this._objectList.length; i++) {
        object = this._objectList.get(i);
        if(object.class.prototype instanceof Creature) {
            this._removeCreature(object.position);
            i--;
        }
    }
};
MapPreview.prototype._removeCreature = function(position) {

    var listIndex = this._objectList.indexOf(position);
    var creature = this.getAtLocation(position);
    if(listIndex === -1 || !(creature instanceof Creature)) return; //return if no creature found at location
    this.clearLocation(creature);
    this._objectList.remove(listIndex);
    this._canvas.drawOutlineAroundTile(position); //redraw outline, since original outline gets erased with the creature
};
