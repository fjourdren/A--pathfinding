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

		this.color = colorSave.GREY
	}

	clearColor() {
		if(!this.wall) {
			this.color = colorSave.GREY
		} else {
			this.color = colorSave.WHITE
		}
	}
	
	update() {
		
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

	getNeighbors(map) {
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

	clearCasesColor() {
		//reset cases color
		for(let x = 0; x < this.mapContent.length; x++) {
			for(let y = 0; y < this.mapContent.length; y++) {
				this.mapContent[x][y].clearColor()
			}
		}
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


let aStar = class aStar {
	constructor(map, caseStart, caseStop) {
		this.map = map
		this.caseStart = caseStart
		this.caseStop = caseStop

		this.timeRunStart = new Date().getTime()
		this.timeRunStop = undefined
		this.timeRun = undefined

		this.open = []	// array of cases to process
		this.close = []	// array of cases already processed

		this.finalCaseAStar = undefined

		this.finish = false
		this.found = false
	}

	time() {
		return new Date().getTime()
	}

	calculateTimeToRender() {
		let out = this.time() - this.timeRunStart
		this.timeRun = out
		return out
	}

	addToOpen(CaseAStarInstance) {
		if(elementExistInArray(this.close, CaseAStarInstance) == false) {
			this.open.push(CaseAStarInstance)
		} else {
			for(let i = 0; i < this.open.length; i++) {
				if(this.open[i].global > CaseAStarInstance.global) {
					if(this.open[i].case.position == CaseAStarInstance.case.position) {
						this.open[i] = CaseAStarInstance
					}
				}
			}
		}
	}

	addToClose(CaseAStarInstance) {
		if(elementExistInArray(this.close, CaseAStarInstance) == false) {
			this.close.push(CaseAStarInstance)
		}
	}

	removeFromOpen(CaseAStarInstance) {
		let out = []
	
		for(let i = 0; i < this.open.length; i++) {
			if(this.open[i].case != CaseAStarInstance.case)
				out.push(this.open[i])
		}
	
		this.open = out
		return out
	}

	getLowestGlobalFromOpen() {
		let lowest
		
		for(let i = 0; i < this.open.length; i++) {
			if(lowest == undefined 
				|| lowest.global > this.open[i].global) {
				lowest = this.open[i]
			}
		}
	
		return lowest
	}

	run() {
		this.timeRunStart = this.time()

		let CaseAStarStart = new CaseAStar(this.caseStart)
		let CaseAStarStop = new CaseAStar(this.caseStop)
	
		this.open = []
		this.close = []
	
		this.finish = false
		this.found = false
	
		this.finalCaseAStar = undefined
	

		this.map.clearCasesColor() // reset color case before update path

		
		do {
			let caseInTestAStar


			// find the next CaseAStar to process
			if(this.open.length == 0) {
				caseInTestAStar = CaseAStarStart
			} else {
				caseInTestAStar = this.getLowestGlobalFromOpen() // Select closest from the target in Open array thanks to his global value
			}


			if(caseInTestAStar != undefined) {
				// generate/update his neighbors caseAstar and add/update it in open array
				let casesInTestArray = caseInTestAStar.case.getNeighbors(mapInstance)
				casesInTestArray.forEach(async (caseInGeneration) => {
					let caseAStarInGeneration = new CaseAStar(caseInGeneration)
					
					caseAStarInGeneration.setParent(caseInTestAStar)
					caseAStarInGeneration.calculateEuristic(CaseAStarStop)
					caseAStarInGeneration.calculateLocal()
					caseAStarInGeneration.calculateGlobal()

					this.addToOpen(caseAStarInGeneration)
					
					// check if we have solved a path
					if(caseAStarInGeneration.case == this.caseStop) {
						this.finish = true
						this.found = true
						this.finalCaseAStar = caseAStarInGeneration
						console.log("Solution found !")
					}
				})
				
				// add CaseAStar processed into close array and remove it from open array
				this.addToClose(caseInTestAStar)
				this.removeFromOpen(caseInTestAStar)
			}
			
	
			// check if open array is empty. If it is, any solution exists
			if(this.open.length <= 0) {
				this.finish = true
				this.found = false
				console.log("Solution not found")
			}

			//console.log("Open : " + this.open.length + " | close : " + this.close.length)
		} while(this.finish == false)


		// Calculate time we took to run the search algorithm
		this.calculateTimeToRender()
	}
}




/*
* UTILS
*/
// need that to not kill P5.js ES6 no support
function renderRect(position, size) {
	rect(position.x * size + 1, position.y * size + 1, size - 1, size - 1)
}


function randomNumber(min, max) {
	return Math.floor(Math.random() * max) + min
}

function elementExistInArray(arrayIn, element) {
	for(let i = 0; i < arrayIn.length; i++) {
		if(arrayIn[i].case.position == element.case.position) {
			return true
		}
	}
	
	return false
}




/*
* Main program
*/
var caseSize = 25
var mapInstance
var aStarInstance

var colorSave

function setup() {
	// need to be there because P5.js don't allow to use his function somewhere else than in his own function (ex: color)
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
	
	// generate case Start
	let caseStart = mapInstance.randomCase()

	// generate case Stop different from the case Start 
	let caseStop
	do {
		caseStop = mapInstance.randomCase()
	} while(caseStop === caseStart)
	

	aStarInstance = new aStar(mapInstance, caseStart, caseStop)
	aStarInstance.run()
}


function draw() {
	background(0)   // Set the background to black
	

	// Apply color to open array's cases
	for(let i = 0; i < aStarInstance.open.length; i++) {
		let caseToDraw = aStarInstance.open[i].case
		if(caseToDraw != aStarInstance.caseStart && caseToDraw != aStarInstance.caseStop)
			aStarInstance.open[i].case.color = colorSave.ORANGE
	}


	// Apply color to close array's cases
	for(let i = 0; i < aStarInstance.close.length; i++) {
		let caseToDraw = aStarInstance.close[i].case
		if(caseToDraw != aStarInstance.caseStart && caseToDraw != aStarInstance.caseStop)
			aStarInstance.close[i].case.color = colorSave.RED
	}


	// if we have found a path, we render it by a recursive loop in final case's parents
	if(aStarInstance.found) {
		let lastParentRender = aStarInstance.finalCaseAStar
		while(lastParentRender.parent != undefined) {
			if(lastParentRender.case != aStarInstance.caseStop) {
				lastParentRender.case.color = colorSave.YELLOW
			}

			lastParentRender = lastParentRender.parent
		}
	}

	// change start and stop cases' color
	aStarInstance.caseStart.color = colorSave.GREEN
	aStarInstance.caseStop.color = colorSave.BLUE


	// we run update and draw method from each cases
	for (let x = 0; x < mapInstance.mapContent.length; x++) {
		for (let y = 0; y < mapInstance.mapContent[0].length; y++) {
			let caseIntance = mapInstance.mapContent[x][y]
			caseIntance.update()
			caseIntance.draw()
		}
	}


	// Update performance message
	if(aStarInstance.timeRun != undefined) {
		document.getElementById("timeToRunPathFinder").innerHTML = aStarInstance.timeRun + "ms to search a path"
	} else {
		document.getElementById("timeToRunPathFinder").innerHTML = ""
	}
}


// add a wall where mouse is pressed
function mousePressed() {
	let x = Math.floor(mouseX / caseSize)
	let y = Math.floor(mouseY / caseSize)

	if(mapInstance.mapContent[x] != undefined 			// eliminate undefined x row
		&& mapInstance.mapContent[x][y] != undefined) {	// eliminate undefined y column
		mapInstance.mapContent[x][y].wall = !mapInstance.mapContent[x][y].wall
		aStarInstance.run()
	}
}