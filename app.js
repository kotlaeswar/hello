const express = require('express')
const app = express()
const { Sports, User, Sportname } = require('./models')
const bodyParser = require('body-parser')
const path = require('path')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const connectEnsureLogin = require('connect-ensure-login')
const { Op } = require('sequelize')
const session = require('express-session')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt')
const flash = require('connect-flash')
const { request } = require('http')
const { resourceUsage } = require('process')
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser('todo application'))

app.set('view engine', 'ejs')

const saltRounds = 10

const formattedDate = (d) => {
  return d.toISOString().split('T')[0]
}

app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))
app.use(flash())

app.use(session({
  secret: 'the-key-to-future-login-lies-here-84482828282',
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}))

app.use(function (request, response, next) {
  response.locals.messages = request.flash()
  next()
})

app.use(passport.initialize())
app.use(passport.session())

app.get('/', async (req, res) => {
  res.render('index', { title: 'Sports Scheduler' })
})

app.get('/signup', (request, response) => {
  response.render('signup', { title: 'Signup' })
})

// app.get('/signup/admin', (request, response) => {
//   response.render('admin-signup', { title: 'Admin-Signup' })
// })

// app.get('/signup/player', (request, response) => {
//   response.render('player-signup', { title: 'Player signup' })
// })

app.get('/signup/:role', (req, res) => {
  const { role } = req.params
  if (role === 'admin') {
    res.render('admin-signup', { title: 'Admin-Signup' })
  } else if (role === 'player') {
    res.render('player-signup', { title: 'Player Signup' })
  } else {
    // Handle invalid role
    res.redirect('/')
  }
})

app.post('/adminusers', async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  if (request.body.firstName == '') {
    request.flash('error', 'First name cannot be left blank')
    return response.redirect('/signup/admin')
  }
  if (request.body.email == '') {
    request.flash('error', 'Email is required for login and cannot be left blank')
    return response.redirect('/signup/admin')
  }
  if (request.body.password == '' || request.body.password.length < 8) {
    request.flash('error', 'The password must be atleast 8 characters long')
    return response.redirect('/signup/admin')
  }

  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      role: 'admin',
      sessions: ''
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect('/home')
    })
  } catch (error) {
    request.flash('error', 'Email already registered')
    response.redirect('/signup/admin')
    console.log(error)
  }
})

app.post('/playingusers', async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds)
  if (request.body.firstName == '') {
    request.flash('error', 'First name cannot be left blank')
    return response.redirect('/signup/player')
  }
  if (request.body.email == '') {
    request.flash('error', 'Email is required for login and cannot be left blank')
    return response.redirect('/signup/player')
  }
  if (request.body.password == '' || request.body.password.length < 8) {
    request.flash('error', 'The password must be atleast 8 characters long')
    return response.redirect('/signup/player')
  }
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      sessions: ''
    })
    request.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      response.redirect('/home')
    })
  } catch (error) {
    request.flash('error', 'Email already registered')
    response.redirect('/signup/player')
    console.log(error)
  }
})

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id)
    done(null, user)
  } catch {
    done(error, null)
  }
})

passport.use('local', new LocalStrategy({ usernameField: 'email', passwordField: 'password' },
  async (username, password, done) => {
    try {
      const user = await User.findOne({ where: { email: username } })
      if (!user) {
        return done(null, false, { message: 'User does not exist' })
      }
      const result = await bcrypt.compare(password, user.password)
      return result ? done(null, user) : done(null, false, { message: 'Invalid Password' })
    } catch (error) {
      return done(error)
    }
  })
)

function requireAdmin (req, res, next) {
  req.user && req.user.role === 'admin' ? next() : res.status(401).json({ message: 'Unauthorized user.' })
}

function requirePlayer (req, res, next) {
  try {
    if (req.isAuthenticated() && req.user.role === 'user') {
      return next()
    } else {
      throw new Error('Unauthorized user.')
    }
  } catch (error) {
    res.status(401).json({ message: error.message })
  }
}

app.get('/signout', connectEnsureLogin.ensureLoggedIn(), (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err)
    }
    response.redirect('/')
  })
})

app.post('/adminsession', passport.authenticate('local', { failureRedirect: '/signin/admin', failureFlash: true }), requireAdmin, (request, response) => {
  response.redirect('/home')
})

app.post('/playersession', passport.authenticate('local', { failureRedirect: '/signin/player', failureFlash: true }), requirePlayer, (request, response) => {
  response.redirect('/home')
})

app.get('/home', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const acc = await User.findByPk(req.user.id)
  const sessionIds = (acc.sessions || '').split(',').filter(Boolean)
  const currentTime = new Date().toISOString().split('T').join(' ').substring(0, 16)
  
  console.log('User role:', acc.role);
  console.log('Session IDs:', sessionIds);
  console.log('Current time:', currentTime);

  const usersessions = await Sports.findAll({
    where: {
      id: sessionIds,
      date: { [Op.gte]: currentTime.substring(0, 10) },
      time: { [Op.gt]: currentTime.substring(11) }
    }
  })

  console.log('User sessions:', usersessions)

  const sportslist = await Sportname.findAll()
  const role = acc.role
  const userName = `${acc.firstName} ${acc.lastName}`

  if (req.accepts('html')) {
    res.render('home', { userName, role, sportslist, usersessions })
  } else {
    res.json({ userName })
  }
})

app.get('/signin', (request, response) => {
  response.render('signin', { title: 'Signin' })
})

app.get('/signin/admin', (request, response) => {
  response.render('admin-signin', { title: 'Admin Signin' })
})

app.get('/signin/player', (request, response) => {
  response.render('player-signin', { title: 'Player Signin' })
})

app.get('/createsession', connectEnsureLogin.ensureLoggedIn(), (request, response) => {
  response.render('createsession', { title: 'Create Session' })
})

app.post('/addsession', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const title = request.body.title
  const date = request.body.date
  const time = request.body.time
  const location = request.body.location
  let players = request.body.players
  const addtional = Number(request.body.additional)
  const acc = await User.findByPk(request.user.id)
  const username = acc.email
  players = username + ',' + players
  const playerlist = players.split(',')
  let playerlist1 = ''
  for (let i = 0; i < playerlist.length; i++) {
    const player = await User.findOne({ where: { email: playerlist[i] } })
    if (player) {
      playerlist1 = playerlist1 + player.id.toString() + ','
    }
  }
  if (location === '' || location === undefined) {
    request.flash('error', 'The location of the session cannot be left blank')
    response.redirect(`/createsession/${title}`)
  }
  if (addtional === '' || addtional === undefined) {
    if (players === '' || players === undefined) {
      request.flash('error', 'A session must have atleast two players')
      response.redirect(`/createsession/${title}`)
    }
  }
  try {
    const session = await Sports.create({ title, date, time, location, players: playerlist1, additional: addtional, userId: request.user.id })
    console.log(addtional)
    let usersess = acc.sessions
    usersess += ',' + session.id
    await acc.update({ sessions: usersess })
    response.redirect('/sport/' + title)
  } catch (error) {
    console.log(error)
  }
})

app.get('/createsport', requireAdmin, (request, response) => {
  response.render('createsport', { title: 'Create Sport' })
})

app.post('/addsport', requireAdmin, async (request, response) => {
  const title = request.body.title
  if (title === '') {
    request.flash('error', 'Name of the sport cannot be left blank')
    return response.redirect('/createsport')
  }
  try {
    await Sportname.create({ title, userId: request.user.id })
    response.redirect('/home')
  } catch (error) {
    request.flash('error', 'Sport already exists.')
    response.redirect('/home')
  }
})
app.get('/sport/:sport', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const acc = await User.findByPk(request.user.id)
  const role = acc.role
  const sport = request.params.sport
  const sessions = await Sports.findAll({ where: { title: sport } })

  const upsessions = []
  const currentTime = new Date()

  for (let i = 0; i < sessions.length; i++) {
    const sessionTime = new Date(sessions[i].date + 'T' + sessions[i].time)
    if (sessionTime > currentTime) {
      upsessions.push(sessions[i])
    }
  }

  try {
    const all = await Sportname.findAll({ where: { title: sport } })
    const sports = all[0]
    response.render('sport', { sport, role, ses: upsessions, userid: request.user.id, owner: sports.userId })
  } catch (error) {
    console.log(error)
  }
})

app.get('/createsession/:sport', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const sport = request.params.sport
  response.render('createsession', { title: 'Create Session', sport })
})

app.get('/session/:id', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const id = request.params.id
  const session = await Sports.findByPk(id)
  const owner = await User.findByPk(session.userId)
  const ownername = owner.firstName + ' ' + owner.lastName
  const sport = await Sportname.findOne({ where: { title: session.title } })
  const sportowner = sport.userId
  const acc = await User.findByPk(request.user.id)
  const role = acc.role
  const userName = acc.firstName + ' ' + acc.lastName
  const players = session.players
  const playerlist = players.split(',')
  const playerlist1 = []
  const play = []
  if (playerlist.length > 0) {
    for (let i = 0; i < playerlist.length; i++) {
      if (Number(playerlist[i]).toString() != 'NaN') {
        play.push(playerlist[i])
        const player = await User.findByPk(Number(playerlist[i]))
        if (player) {
          const playername = player.firstName + ' ' + player.lastName
          playerlist1.push(playername)
        }
      }
    }
  }
  response.render('session', { title: 'Session', session, role, userid: request.user.id, userName, owner: ownername, players: playerlist1, playerid: play, sportowner, sport: session.title })
})

app.put('/session/:id', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const user = await User.findOne({ where: { id: request.user.id } })
  let usersessions = user.sessions
  const session = await Sports.findByPk(request.params.id)
  let additional = Number(session.additional)
  if (request.body.type == 'join') {
    additional -= 1
    usersessions += ',' + request.params.id
  } else if (request.body.type == 'leave') {
    additional += 1
    const n = usersessions.split(',')
    let str = ''
    for (let i = 0; i < n.length; i++) {
      if (n[i] != request.body.session) {
        str += n[i]
        if (i != n.length - 1) {
          str += ','
        }
      }
    }
    usersessions = str
  }
  try {
    await user.update({ sessions: usersessions })
    await session.update({ players: request.body.player, additional })
    return response.json({ Success: true })
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.delete('/session/:id', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const session = await Sports.findOne({ where: { id: request.params.id } })
  if (session.userId != request.user.id) {
    request.flash('error', 'You are not authorized to delete this session')
    return response.redirect(`/session/${request.params.id}`)
  }
  try {
    await Sports.destroy({ where: { id: request.params.id } })
    return response.json({ Success: true })
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.delete('/sport/:sport', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  try {
    const sport = await Sportname.findOne({ where: { title: request.params.sport } })
    if (!sport || sport.userId !== request.user.id) {
      request.flash('error', 'You are not authorized to delete this sport')
      return response.redirect(`/sport/${request.params.sport}`)
    }

    await Sportname.destroy({ where: { title: request.params.sport } })
    return response.json({ Success: true })
  } catch (error) {
    console.log(error)
    return response.status(422).json({ error: 'Failed to delete sport' })
  }
})

app.put('/admin/session/:id', requireAdmin, async (request, response) => {
  try {
    const session = await Sports.findByPk(request.params.id)
    return response.json(session.update({ players: request.body.player }))
  } catch (error) {
    console.log(error)
    return response.status(422).json(error)
  }
})

app.get('/sport/:sport/report', requireAdmin, async (request, response) => {
  const sessions = await Sports.findAll({ where: { title: request.params.sport } })
  const upsessions = []
  const pastsessions = []
  for (let i = 0; i < sessions.length; i++) {
    const t = new Date().toISOString().split('T')
    const date = t[0]
    const time = t[1].substring(0, 5)
    const gtime = sessions[i].time
    if (sessions[i].date == date) {
      if (gtime > time) {
        upsessions.push(sessions[i])
      } else {
        pastsessions.push(sessions[i])
      }
    } else if (sessions[i].date > date) {
      upsessions.push(sessions[i])
    } else {
      pastsessions.push(sessions[i])
    }
  }
  response.render('reports', { pastses: pastsessions, upses: upsessions, sport: request.params.sport })
})

app.get('/session/:id/edit', requireAdmin, (request, response) => {
  const id = request.params.id
  response.render('editsession', { title: 'Update Session', id })
})

app.get('/updatepassword', connectEnsureLogin.ensureLoggedIn(), (request, response) => {
  res.render('changepassword')
})

app.post('/updatepassword', connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const newPassword = request.body.newpass
  const confirmPassword = request.body.renewpass

  if (newPassword !== confirmPassword) {
    request.flash('error', 'Passwords do not match')
    return response.redirect('/changepassword')
  }

  const newhashedpwd = await bcrypt.hash(newPassword, saltRounds)
  await request.user.update({ password: newhashedpwd })

  request.flash('error', 'Your password has changed')
  return response.redirect('/home')
})

app.get('/login', (request, response) => {
  response.redirect('/signin')
})

module.exports = app
