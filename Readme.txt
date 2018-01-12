:::Ver 3.1::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
/*** Changelog ***/
1) Fixed minor remaining bugs.
2) Minified CSS & JS code to reduce file size and improve load times
3) Combined all JS code into one file to reduce number of http requests
4) Ecolamity is ready for deployment.

:::Ver 3.0::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
/*** Changelog ***/
1) Updated images for pause, help, start game, and reset map buttons
2) Desert environment implemented
3) Ocean environment implemented
4) Main Menu implemented
5) Species description added to Map Edit screen



:::Ver 2.2::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
/*** Changelog ***/
1) Encapsulated row & col positions into a Position class. Updated all code
   to comply with Position class implementation.

2) Encapsulated the game's list of creatures into a CreatureList class,
   which maintains the creatures in the game along with the number of
   existing animals.

3) Defined a List class, which serves as a proxy for array handling 
   (implementing get, push, & remove operations). Both the CreatureList 
   and ObjectList inherit it due to performing similar operations.

4) Fixed issue with reproduction failing for PlantBehavior.

5) Wrapped filepaths for background image urls in quotes to prevent 
   filepath errors in case of file movement/renaming.



:::Ver 2.1::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
/*** Changelog ***/
1) Encapsulated creature behavior into a Behavior class, allowing behaviors
   to be modularly implemented for each species.  Each species class sets
   a behavior class type, which is initiated per creature by the game class.

2) Implemented multiple default Behavior subclasses (Mild, Erratic, Linear),
   which define different forms of movement. These serve as a skeleton for
   implementing creature behaviors.

3) Encapsulated creature move speed into a MoveSpeed class.



:::Ver 2.0::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
/*** Changelog ***/
1) Encapsulated MapCanvas from GameMap, whose responsibility is to draw objects
   onto the canvas representing the game map.

2) Encapsulated object sprites into a Sprite class, in which every creature &
   obstacle composes.

3) Encapsulated animal food meter into a FoodMeter class, composed by every animal

4) Each creature contains a StatsBlock instance, so that the stats display can be
   updated as soon as creature stats are changed.

5) Removed Sidebar class due to lack of meaningful functionality.


/*** Implemented ***/
1) Map Edit Screen
2) Dynamic Screen Transitions: using ajax and html templates
3) Environment Obstacles
4) Creature Animations


/*** Other ***/
1) Began implementation of Desert environment



:::Ver 1.0::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::
/*** Ecolamity Initial Prototype ***/
This is a basic implementation of the Jungle environment

Not Currently Implemented
1) Map Editing
2) Obstacles
3) Creature Animations
4) Additional Environments