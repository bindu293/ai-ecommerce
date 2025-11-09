pipeline {
    agent any

    environment {
        // Path to your docker-compose file
        COMPOSE_FILE = 'docker-compose.yml'
        // Docker Hub credentials ID (if you push images later)
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials'
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout the source code from your repository
                checkout scm
            }
        }

        stage('Build') {
            steps {
                script {
                    // Build the Docker images using Windows batch commands
                    bat "docker-compose -f ${env.COMPOSE_FILE} build"
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    // Run backend tests
                    bat "docker-compose -f ${env.COMPOSE_FILE} run --rm backend npm test"
                    // Run frontend tests
                    bat "docker-compose -f ${env.COMPOSE_FILE} run --rm frontend npm test"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Deploy the application
                    bat "docker-compose -f ${env.COMPOSE_FILE} up -d"
                }
            }
        }
    }

    post {
        always {
            // Clean up the environment
            bat "docker-compose -f ${env.COMPOSE_FILE} down"
        }
    }
}
