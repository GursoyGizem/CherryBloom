const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const session = require('express-session');

app.set("view engine","ejs");
app.use('/node_modules', express.static(__dirname + '/node_modules'));
app.use('/public', express.static(__dirname + '/public'));
app.use('/data', express.static(__dirname + '/data'));
app.use(express.urlencoded({extended : false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret:'designProject',
    resave: false,
    saveUninitialized: true
}));

//routers
//enroll router
app.get('/enroll', (req, res) => {
    res.render("enroll");
});

//enroll sayfasindan isim, soyisim, yas, boy, kilo ve sifre alinarak users.json dosyasina kaydedilir
app.post('/enroll', (req, res) => {
    const { kullanici_ismi, kullanici_soyadi, kullanici_yasi, kullanici_boyu, kullanici_kilosu, sifre } = req.body;

    const userData = {
        isim: kullanici_ismi,
        soyisim: kullanici_soyadi,
        yas: kullanici_yasi,
        boy: kullanici_boyu,
        kilo: kullanici_kilosu,
        sifre: sifre
    };

    fs.readFile('./data/users.json', (err, data) => {
        let users = [];
        if (!err) {
            try {
                users = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing users.json:', parseErr);
                return res.status(500).send('An error occurred while processing the user data.');
            }
        }

        users.push(userData);

        fs.writeFile('./data/users.json', JSON.stringify(users, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send('An error occurred while saving user data.');
            }

            res.redirect('/');
        });
    });
});

//login router
app.get("/login", (req, res) => {
    res.render("login");
});

//login sayfasinda girilen bilgileri users.json dosyası ile karsilastirilarak basarili/basarisiz giris saglanmistir
//find() metodu kullanilarak giris yapan kullaniciların tum bilgileri alinarak users degiskenine atanmistir
//kisiye ozgu web sayfasi oldugu icin oturum acan kullanicinın bilgileri req.session.user tutulmustur
app.post('/login', (req, res) => {
    const { kullanici_ismi, kullanici_soyadi, sifre } = req.body;

    fs.readFile('./data/users.json', (err, data) => {
        if (err) {
            console.error('Error reading users.json:', err);
            return res.status(500).send('An error occurred while processing your login.');
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.isim === kullanici_ismi && u.soyisim === kullanici_soyadi && u.sifre === sifre);

        if (user) {
            req.session.user = user;
            res.redirect('/calorie_count');
        } else {
            res.status(401).send('Invalid login credentials.');
        }
    });
});

//caloire count router
app.get('/calorie_count', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        res.render('calorie_count', { user: req.session.user });
    }
});

//water tracker router
app.get('/water_tracking', (req, res) => {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        res.render('water_tracking', { user_water: req.session.user });
    }
});

//kullanicinin gunluk ictigi su miktarının water_tracking.json dosyasına kaydedilme islemi 
app.post('/save-water-intake', (req, res) => {
    const { username, date, waterIntake, dailyTarget } = req.body;

    fs.readFile('./data/water_tracking.json', (err, data) => {
        let waterData = [];
        if (!err) {
            try {
                waterData = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing water_tracking.json:', parseErr);
                return res.status(500).send('An error occurred while processing water tracking data.');
            }
        }

        const userWaterData = {
            username: username || 'Anonim',
            date,
            waterIntake,
            dailyTarget
        };

        waterData.push(userWaterData);

        fs.writeFile('./data/water_tracking.json', JSON.stringify(waterData, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file:', err);
                return res.status(500).send('An error occurred while saving water tracking data.');
            }

            res.status(200).send('Water tracking data saved successfully.');
        });
    });
});

//update router
app.get("/update", (req, res) => {
    if (!req.session.user ) {
      return res.redirect("/login");
    }
    res.render("update", { user: req.session.user });
  });

//kullanicinin girdigi bilgilerinin degistirilmesi
app.post("/update", (req, res) => {
    const { isim, soyisim, yas, boy, kilo } = req.body;
    const currentUser = req.session.user;
  
    if (!currentUser) {
      return res.redirect("/login");
    }

    let users = JSON.parse(fs.readFileSync("./data/users.json", "utf8"));
  
    users = users.map(u => {
      if (u.isim === currentUser.isim && u.sifre === currentUser.sifre) {
        return { ...u, isim, soyisim, yas, boy, kilo };
      }
      return u;
    });

    fs.writeFileSync("./data/users.json", JSON.stringify(users, null, 2), "utf8");
  
    req.session.user = users.find(u => u.isim === isim && u.sifre === currentUser.sifre);
  
    res.redirect("/update");
  });

//sport router
app.get("/sport", (req, res) => {
    res.render("sport");
});

//menstrual cycle tracking router
app.get("/menstrual_cycle_tracking", (req, res) => {
    res.render("menstrual_cycle_tracking");
});

//homepage router
app.get("/", (req, res) => {
    res.render("homepage");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});