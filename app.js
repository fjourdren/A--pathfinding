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
		return new Location(x, y)
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
}


let CaseAStar = class CaseAStar {
	constructor(meCase) {
		this.case = meCase
	}

	setParent(parent) {
		this.parent = parent
	}

	calculateEuristic(destination) {
		this.euristic = distanceBeetweenTwoCaseAStar(this, destination)
		return this.euristic
	}

	// nodeParentLocal + nodeParentDistance
	calculateLocal() {
		if(this.parent != undefined) {
			let parentLocal = this.parent.calculateLocal()
			this.local = parentLocal + distanceBeetweenTwoCaseAStar(this, this.parent)
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
}


//nees that to not kill P5.js ES6 no support
function renderRect(position, size) {
	rect(position.x * size + 1, position.y * size + 1, size - 1, size - 1)
}



var caseSize = 25
var mapSize = 20
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

	if(mapInstance.mapContent[x] != undefined && mapInstance.mapContent[x][y] != undefined) {
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
			if(mapInstance.mapContent[x][y].color != colorSave.BLUE && mapInstance.mapContent[x][y].color != colorSave.GREEN && mapInstance.mapContent[x][y].color != colorSave.WHITE) {
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
			let casesInTestArray = getCaseAround(caseInTestAStar)
			if(casesInTestArray.length > 0) {
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


function distanceBeetweenTwoCaseAStar(case1, case2) {
	let diffx = Math.abs(case1.case.position.x - case2.case.position.x)
	let diffy = Math.abs(case1.case.position.y - case2.case.position.y)

	if(case1.case.position == case2.case.position)
		return 0

	if(case1.case.position.x == case2.case.position.x)
		return diffy

	if(case1.case.position.y == case2.case.position.y)
		return diffx

	return Math.floor(Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2))) + 1  // we add +1 to have a human result
}


function getCaseAround(caseCenterAStar) {
	let out = []
	
	for (let x = caseCenterAStar.case.position.x - 1; x <= caseCenterAStar.case.position.x + 1; x++) {
		for (let y = caseCenterAStar.case.position.y - 1; y <= caseCenterAStar.case.position.y + 1; y++) {
			if(mapInstance.mapContent[x] != undefined && mapInstance.mapContent[x][y] != undefined && mapInstance.mapContent[x][y].position != caseCenterAStar.case.position && mapInstance.mapContent[x][y].wall == false) {
				out.push(mapInstance.mapContent[x][y])
			}
		}
	}


	return out
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