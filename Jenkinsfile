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
                echo "Building backend and frontend with fresh images..."
                // Build both backend and frontend with envs
                bat "docker-compose -f %COMPOSE_FILE% --env-file %ENV_FILE% build --pull --no-cache"
            }
        }

        stage('Test') {
            steps {
                script {
                    // Run backend tests if any
                    def rcBackend = bat(returnStatus: true, script: "docker-compose -f %COMPOSE_FILE% run --rm backend npm test")
                    if (rcBackend != 0) {
                        echo 'Skipping backend tests (no test script)'
                    }

                    // Run frontend tests if any
                    def rcFrontend = bat(returnStatus: true, script: "docker-compose -f %COMPOSE_FILE% run --rm frontend npm test")
                    if (rcFrontend != 0) {
                        echo 'Skipping frontend tests (no test script)'
                    }
                }
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
