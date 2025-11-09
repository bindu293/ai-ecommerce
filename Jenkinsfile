pipeline {
    agent any

    environment {
        // Path to your docker-compose file
        COMPOSE_FILE = 'docker-compose.yml'
        // Your Docker Hub credentials ID (store it in Jenkins credentials)
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
                    // Build the Docker images
                    docker.withRegistry('https://registry.hub.docker.com', DOCKER_CREDENTIALS_ID) {
                        sh "docker-compose -f ${env.COMPOSE_FILE} build"
                    }
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    // Run backend tests
                    sh "docker-compose -f ${env.COMPOSE_FILE} run --rm backend npm test"
                    // Run frontend tests
                    sh "docker-compose -f ${env.COMPOSE_FILE} run --rm frontend npm test"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Deploy the application
                    sh "docker-compose -f ${env.COMPOSE_FILE} up -d"
                }
            }
        }
    }

    post {
        always {
            // Clean up the environment
            sh "docker-compose -f ${env.COMPOSE_FILE} down"
        }
    }
}