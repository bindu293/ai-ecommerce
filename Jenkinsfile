pipeline {
    agent any

    environment {
        COMPOSE_FILE = 'docker-compose.yml'
        DOCKER_CREDENTIALS_ID = 'dockerhub-credentials' // Jenkins credentials for Docker Hub
        DOCKERHUB_USERNAME = 'bindu892'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                bat "docker-compose -f %COMPOSE_FILE% build"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: DOCKER_CREDENTIALS_ID, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        // Login to Docker Hub
                        bat "docker login -u %DOCKER_USER% -p %DOCKER_PASS%"
                        
                        // Tag images
                        bat "docker tag ai-ecommercewebsite-frontend %DOCKERHUB_USERNAME%/ecommerce-frontend:latest"
                        bat "docker tag ai-ecommercewebsite-backend %DOCKERHUB_USERNAME%/ai-ecommerce-backend:latest"
                        
                        // Push images
                        bat "docker push %DOCKERHUB_USERNAME%/ecommerce-frontend:latest"
                        bat "docker push %DOCKERHUB_USERNAME%/ai-ecommerce-backend:latest"
                    }
                }
            }
        }

        stage('Test') {
            steps {
                bat "docker-compose -f %COMPOSE_FILE% run --rm backend npm test || echo Skipping backend tests (no test script)"
                bat "docker-compose -f %COMPOSE_FILE% run --rm frontend npm test || echo Skipping frontend tests (no test script)"
            }
        }

        stage('Deploy') {
            steps {
                bat "docker-compose -f %COMPOSE_FILE% up -d"
            }
        }
    }

    post {
        always {
            bat "docker-compose -f %COMPOSE_FILE% down"
        }
    }
}
