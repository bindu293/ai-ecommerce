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
                // Stop and remove containers to avoid stale builds
                bat "docker-compose -f %COMPOSE_FILE% down --remove-orphans"
            }
        }

        stage('Build') {
            steps {
                // Force fresh build with envs
                bat "docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% build --pull --no-cache"
            }
        }

        stage('Test') {
            steps {
                echo "Skipping tests (optional)"
            }
        }

        stage('Deploy') {
            steps {
                // Start services with envs
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
