# Installation Instructions

### Navigate to /GenerationAPI
```sh
cd GenerationAPI
```

### Create Virtual Environment
```sh
python -m venv .venv
```

### Activate Environment
```sh
.venv\Scripts\activate  (for Windows)
source .venv/bin/activate (for MacOS/Linux)
```

### Install Dependencies
```sh
pip install -r requirements.txt
```

### Start the server!
```sh
python app.py
```

server will run on http://127.0.0.1:3003
The first time calling the api will take longer than normal as the model needs to first be downloaded