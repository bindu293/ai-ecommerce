pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        ENV_FILE = '.env'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Pre-clean') {
            steps {
                echo "Stopping and removing any old containers..."
                bat "docker-compose -f %COMPOSE_FILE% down --remove-orphans"
            }
        }

        stage('Build') {
            steps {
                echo "Building backend..."
                bat "docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% build --pull --no-cache backend"
                
                echo "Building frontend with Firebase envs..."
                // Pass each VITE_FIREBASE_* explicitly from .env
                bat """
                setlocal EnableDelayedExpansion
                for /F "usebackq tokens=1,2 delims==" %%A in (%ENV_FILE%) do (
                    set %%A=%%B
                )
                docker-compose -f %COMPOSE_FILE% build --build-arg VITE_FIREBASE_API_KEY=!VITE_FIREBASE_API_KEY! ^
                                                     --build-arg VITE_FIREBASE_AUTH_DOMAIN=!VITE_FIREBASE_AUTH_DOMAIN! ^
                                                     --build-arg VITE_FIREBASE_PROJECT_ID=!VITE_FIREBASE_PROJECT_ID! ^
                                                     --build-arg VITE_FIREBASE_STORAGE_BUCKET=!VITE_FIREBASE_STORAGE_BUCKET! ^
                                                     --build-arg VITE_FIREBASE_MESSAGING_SENDER_ID=!VITE_FIREBASE_MESSAGING_SENDER_ID! ^
                                                     --build-arg VITE_FIREBASE_APP_ID=!VITE_FIREBASE_APP_ID! frontend
                """
            }
        }

        stage('Test') {
            steps {
                echo "Skipping tests (optional)"
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploying containers..."
                bat "docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% up -d"
            }
        }
    }

    post {
        always {
            echo "✅ Deployment complete. Your website is running."
            echo "🌐 View it in browser at: http://localhost:5175"
        }
    }
}
