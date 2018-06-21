let Map = class Map {
	constructor(mapSize) {
		this.mapSize = mapSize
		this.mapContent = this.generate()
	}

	generate() {
		let map = []
  
		for (let x = 0; x < this.mapSize; x++) {
			map[x] = []
			for (let y = 0; y < this.mapSize; y++) {
				let position = new Position2D(x, y)
				map[x][y] = new Case(position, caseSize)
			}
		}
	
		this.mapContent = map
		return map
	}

	randomLocation() {
		let x = randomNumber(0, this.mapContent.length - 1)
		let y = randomNumber(0, this.mapContent[x].length - 1)
		return new Position2D(x, y)
	}

	randomCase() {
		let loc = this.randomLocation()
		return this.mapContent[loc.x][loc.y]
	}
}



let Position2D = class Position2D {
	constructor(x, y) {
		this.x = x
		this.y = y
	}
}



let Case = class Case {
	constructor(position, size) {
		this.position = position
		this.size = size
		this.wall = false

		this.color = color(140, 140, 140)
	}

	update() {
		if(this.wall) {
			this.color = color(255, 255, 255)
		} else if(this.color == color(255, 255, 255)) {
			this.color = color(140, 140, 140)
		}
	}

	draw() {
		fill(this.color)
		noStroke()
		renderRect(this.position, this.size)
	}

	calculateDistance(caseDestination) {
		let diffx = Math.abs(this.position.x - caseDestination.position.x)
		let diffy = Math.abs(this.position.y - caseDestination.position.y)
	
		if(this.position == caseDestination.position)
			return 0
	
		if(this.position.x == caseDestination.position.x)
			return diffy
	
		if(this.position.y == caseDestination.position.y)
			return diffx
	
		return Math.floor(Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2)))
	}

	getNeighbor(map) {
		let out = []
		
		for (let x = this.position.x - 1; x <= this.position.x + 1; x++) {
			for (let y = this.position.y - 1; y <= this.position.y + 1; y++) {
				if(map.mapContent[x] != undefined 					  // eliminate undefined x row
					&& map.mapContent[x][y] != undefined 			  // eliminate undefined y column
					&& map.mapContent[x][y].position != this.position // eliminate himself from his neighbor
					&& map.mapContent[x][y].wall == false) {		  // Don't take walls
					out.push(map.mapContent[x][y])
				}
			}
		}

		return out
	}
}



let CaseAStar = class CaseAStar {
	constructor(meCase) {
		this.case = meCase
	}

	setParent(parent) {
		this.parent = parent
	}

	calculateEuristic(destination) {
		this.euristic = this.calculateEuristicByDistance(destination)
		return this.euristic
	}

	// nodeParentLocal + nodeParentDistance
	calculateLocal() {
		if(this.parent != undefined) {
			let parentLocal = this.parent.calculateLocal()
			this.local = parentLocal + this.calculateEuristic(this.parent)
		} else {
			this.local = 0
		}

		return this.local
	}

	// euristic + local
	calculateGlobal() {
		this.calculateLocal()
		this.global = this.euristic + this.local
		return this.global
	}

	calculateEuristicByDistance(caseAStarDestination) {
		let diffx = Math.abs(this.case.position.x - caseAStarDestination.case.position.x)
		let diffy = Math.abs(this.case.position.y - caseAStarDestination.case.position.y)
	
		if(this.case.position == caseAStarDestination.case.position)
			return 0
	
		if(this.case.position.x == caseAStarDestination.case.position.x)
			return diffy
	
		if(this.case.position.y == caseAStarDestination.case.position.y)
			return diffx
	
		return Math.floor(Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2))) + 1  // we add +1 to have a human result
	}
}



//nees that to not kill P5.js ES6 no support
function renderRect(position, size) {
	rect(position.x * size + 1, position.y * size + 1, size - 1, size - 1)
}



var caseSize = 25
var mapInstance

var caseStart, caseStop

var open = []
var close = []

var finish = false
var found = false

var colorSave

var finalCaseAStar


function setup() {
	colorSave = {
		GREEN: color(0, 255, 0),		// Start case
		BLUE: color(0, 0, 255),			// Target case
		RED: color(255, 0, 0),			// Case in close array
		YELLOW: color(232, 244, 0),		// Path
		ORANGE: color(255,165,0),		// Open when path is find
		WHITE: color(255, 255, 255),	// Wall
		GREY: color(140, 140, 140)		// Default case color
	}

	createCanvas(501, 501)
	frameRate(30)
	stroke(255) // Set line drawing color to white

	// generate map
	mapInstance = new Map(20)
	
	caseStart = mapInstance.randomCase()
	caseStart.color = colorSave.GREEN

	do {
		caseStop = mapInstance.randomCase()
		caseStop.color = colorSave.BLUE
	} while(caseStop === caseStart)
	

	calculateAStar()
}


function draw() {
	background(0)   // Set the background to black
	

	// modification des couleurs
	for(let i = 0; i < open.length; i++) {
		let caseToDraw = open[i].case
		if(caseToDraw != caseStart && caseToDraw != caseStop)
			open[i].case.color = colorSave.ORANGE
	}


	for(let i = 0; i < close.length; i++) {
		let caseToDraw = close[i].case
		if(caseToDraw != caseStart && caseToDraw != caseStop)
			close[i].case.color = colorSave.RED
	}


	if(found) {
		let lastParentRender = finalCaseAStar
		while(lastParentRender.parent != undefined) {
			if(lastParentRender.case != caseStop) {
				lastParentRender.case.color = colorSave.YELLOW
			}

			lastParentRender = lastParentRender.parent
		}
	}


	for (let x = 0; x < mapInstance.mapContent.length; x++) {
		for (let y = 0; y < mapInstance.mapContent[0].length; y++) {
			let caseIntance = mapInstance.mapContent[x][y]
			caseIntance.update()
			caseIntance.draw()
		}
	}
}


function mousePressed() {
	let x = Math.floor(mouseX / caseSize)
	let y = Math.floor(mouseY / caseSize)

	if(mapInstance.mapContent[x] != undefined 			// eliminate undefined x row
		&& mapInstance.mapContent[x][y] != undefined) {	// eliminate undefined y column
		mapInstance.mapContent[x][y].wall = !mapInstance.mapContent[x][y].wall
		calculateAStar()
	}
}









function calculateAStar() {
	let CaseAStarStart = new CaseAStar(caseStart)
	let CaseAStarStop = new CaseAStar(caseStop)

	open = []
	close = []

	finish = false
	found = false

	finalCaseAStar = undefined


	//reset all colors
	for(let x = 0; x < mapInstance.mapContent.length; x++) {
		for(let y = 0; y < mapInstance.mapContent.length; y++) {
			if(mapInstance.mapContent[x][y].color != colorSave.BLUE 
				&& mapInstance.mapContent[x][y].color != colorSave.GREEN 
				&& mapInstance.mapContent[x][y].color != colorSave.WHITE) {
				mapInstance.mapContent[x][y].color = colorSave.GREY
			}
		}
	}
	

	do {
		let caseInTestAStar

		if(open.length == 0) {
			caseInTestAStar = CaseAStarStart
		} else {
			caseInTestAStar = getLowestGlobalFromOpen()
		}

		if(caseInTestAStar != undefined) {
			let casesInTestArray = caseInTestAStar.case.getNeighbor(mapInstance)
			for(let i = 0; i < casesInTestArray.length; i++) {
				let caseInGeneration = casesInTestArray[i]
				let caseAStarInGeneration = new CaseAStar(caseInGeneration)

				caseAStarInGeneration.setParent(caseInTestAStar)
				caseAStarInGeneration.calculateEuristic(CaseAStarStop)

				caseAStarInGeneration.calculateLocal()
				caseAStarInGeneration.calculateGlobal()

				if(elementExistInArray(close, caseAStarInGeneration) == false) {
					open.push(caseAStarInGeneration)
				} else {
					for(let i = 0; i < open.length; i++) {
						if(open[i].global > caseAStarInGeneration.global) {
							if(open[i].position == caseInGeneration.position) {
								open[i] = caseAStarInGeneration
							}
						}
					}
				}

				if(caseAStarInGeneration.case == CaseAStarStop.case) {
					finish = true
					found = true
					finalCaseAStar = caseAStarInGeneration
					console.log("Solution found !")
				}
			}
			

			if(elementExistInArray(close, caseInTestAStar) == false) {
				close.push(caseInTestAStar)
			}
			open = removeElementFromArray(open, caseInTestAStar)
		}
		

		if(open.length <= 0) {
			finish = true
			found = false
			console.log("Solution not found")
		}

		//console.log("Open : " + open.length + " | close : " + close.length)
	} while(finish == false)
}



function randomNumber(min, max) {
	return Math.floor(Math.random() * max) + min
}



function getLowestGlobalFromOpen() {
	let lowest
	
	for(let i = 0; i < open.length; i++) {
		if(!lowest || lowest.global > open[i].global) {
			lowest = open[i]
		}
	}

	return lowest
}


function removeElementFromArray(arrayIn, element) {
	let out = []

	for(let i = 0; i < arrayIn.length; i++) {
		if(arrayIn[i].case.position != element.case.position) {
			out.push(arrayIn[i])
		}
	}

	return out
}


function elementExistInArray(arrayIn, element) {
	for(let i = 0; i < arrayIn.length; i++) {
		if(arrayIn[i].case.position == element.case.position) {
			return true
		}
	}

	return false
}